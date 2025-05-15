import fitz  # PyMuPDF
# import openai # Old import
from openai import OpenAI # New import
import os
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()

# Initialize the OpenAI client
# The API key is automatically picked up from the OPENAI_API_KEY environment variable
# which should be loaded from your .env file.
client = OpenAI()

def _extract_text_from_doc(doc: fitz.Document, start_page: int | None = None, end_page: int | None = None) -> str:
    """Extracts text from a given fitz.Document object, optionally from a specific page range (1-indexed)."""
    text = ""
    
    actual_start_page = 0
    if start_page is not None and start_page > 0:
        actual_start_page = start_page - 1 # Convert 1-indexed to 0-indexed
    
    actual_end_page = len(doc) # Default to all pages
    if end_page is not None and end_page > actual_start_page and end_page <= len(doc):
        # User's end_page is 1-indexed, fitz len(doc) is count.
        # For range, if user says page 5 (0-indexed 4), we want to include it.
        # So range should go up to end_page (which is exclusive for range).
        actual_end_page = end_page 

    if actual_start_page >= len(doc):
        print(f"Warning: Start page ({start_page}) is beyond the document length ({len(doc)} pages).")
        return ""
    
    if start_page is not None and end_page is not None and actual_start_page >= actual_end_page:
        print(f"Warning: End page ({end_page}) must be greater than start page ({start_page}). Processing only start page if it's valid.")
        if actual_start_page < len(doc):
            actual_end_page = actual_start_page + 1
        else:
            return "" # Start page itself is out of bounds

    print(f"Extracting text from page {actual_start_page + 1} to {actual_end_page} (inclusive, 1-indexed). Total pages in PDF: {len(doc)}")

    for page_num in range(actual_start_page, actual_end_page):
        if page_num < len(doc):
            page = doc.load_page(page_num)
            text += page.get_text()
        else:
            print(f"Warning: Attempted to load page {page_num + 1}, which is out of bounds.")
            break
    return text

def extract_text_from_pdf_path(pdf_path: str, start_page: int | None = None, end_page: int | None = None) -> str:
    """Extracts text from a PDF file path, optionally from a specific page range (1-indexed)."""
    try:
        doc = fitz.open(pdf_path)
        text = _extract_text_from_doc(doc, start_page, end_page)
        doc.close()
        return text
    except Exception as e:
        print(f"Error opening or reading PDF from path '{pdf_path}': {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 750, overlap: int = 100) -> list[str]:
    """Splits text into manageable chunks with a specified word count and overlap."""
    words = text.split()
    if not words:
        return []

    chunks = []
    current_pos = 0
    while current_pos < len(words):
        start_pos = current_pos
        end_pos = min(current_pos + chunk_size, len(words))
        chunks.append(" ".join(words[start_pos:end_pos]))
        
        if end_pos == len(words):
            break
        current_pos += (chunk_size - overlap)
        if current_pos >= len(words) - overlap and end_pos < len(words) : # ensure last part is captured
             chunks.append(" ".join(words[current_pos:len(words)]))
             break
        elif current_pos >= end_pos : # avoid infinite loop on very small texts or large overlaps
            if end_pos < len(words): # still text left
                 chunks.append(" ".join(words[end_pos:len(words)]))
            break
            
    return chunks

def generate_questions_from_chunk(text_chunk: str, num_questions: int = 3) -> list[dict]:
    """
    Generates multiple-choice questions from a text chunk using an LLM.
    """
    print(f"\n--- Sending chunk to OpenAI for question generation (first 100 chars): ---\n{text_chunk[:100]}...""")

    system_prompt = """You are an expert at creating challenging, university-level exam questions based on provided academic text excerpts.
Your primary goal is to test a student's ability to understand, apply, and analyze the core concepts and information within the text. 
**CRITICAL: Do NOT ask questions about the document's structure, such as section numbers, chapter titles, page numbers, or the organization of the text itself.** 
Focus exclusively on the substantive knowledge conveyed.

For each question:
1.  **Question Style**: 
    *   Frame questions that require higher-order thinking. Present scenarios, ask for the application of principles, or require interpretation of information from the text.
    *   **Absolutely avoid** questions like 'What is Section X about?', 'Which chapter discusses Y?', or any question that relies on knowing the document's layout rather than understanding the content.
    *   Instead, pose questions that start with scenarios, hypothetical situations, or ask for comparisons, implications, or problem-solving based on the concepts in the excerpt.
2.  **Content Focus**: Base questions strictly on the substantive information and concepts within the provided text excerpt. Do not infer information beyond the text.
3.  **Multiple Choice Options**: Provide four distinct answer options. The incorrect options (distractors) should be plausible and related to the topic but clearly wrong according to the excerpt.
4.  **Correct Answer**: Clearly indicate the 0-indexed integer for the correct answer.
5.  **Explanation**: Provide a concise explanation for why the correct answer is right, referencing the specific concepts or information from the text excerpt that support the answer.

Please format your response as a single JSON object. This JSON object should contain one key, "questions", which holds a list of question objects. Each question object in the list should have the following keys:
"question": "The question text (exam-style, application-focused, testing conceptual understanding)",
"options": ["Option A", "Option B", "Option C", "Option D"],
"correct_answer_index": 0,
"explanation": "Brief explanation for the correct answer, referencing concepts in the excerpt."

Example of a desired question type (conceptual):
{
  "questions": [
    {
      "question": "A researcher observes that Event A occurs with probability P(A) and Event B with P(B). If the text describes a scenario where the occurrence of A significantly alters the likelihood of B, how would this relationship be best described using the terminology from the excerpt?",
      "options": ["Events A and B are mutually exclusive.", "Events A and B are independent.", "Events A and B are conditionally dependent.", "The probability of A is the complement of B."],
      "correct_answer_index": 2,
      "explanation": "The excerpt explains that conditional dependency (or dependence) occurs when P(B|A) != P(B), meaning the occurrence of A changes the probability of B. This matches the scenario described."
    }
    // ... more questions ...
  ]
}

Ensure the output is ONLY the JSON object, without any introductory text, comments, or markdown formatting.
"""

    user_prompt = f"""Here is the text excerpt for question generation. Remember to focus SOLELY on the concepts within this text and AVOID any questions about its structure or sectioning:
---
{text_chunk}
---
Please generate {num_questions} multiple-choice questions based on this excerpt.
The output must be a single JSON object with a "questions" key, where the value is a list of question objects, following the format described.
"""

    generated_questions_list = []
    try:
        model_to_use = "gpt-3.5-turbo-1106"
        print(f"Using OpenAI model: {model_to_use}")

        response = client.chat.completions.create( # Updated API call
            model=model_to_use,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,
            max_tokens=1500,
            n=1,
            response_format={ "type": "json_object" }
        )

        content = response.choices[0].message.content # Updated way to access content
        
        print(f"Raw response from OpenAI (first 200 chars): {content[:200]}...")

        try:
            parsed_response = json.loads(content)
            
            if isinstance(parsed_response, dict) and "questions" in parsed_response and isinstance(parsed_response["questions"], list):
                raw_questions = parsed_response["questions"]
                for q_data in raw_questions:
                    if isinstance(q_data, dict) and all(k in q_data for k in ["question", "options", "correct_answer_index", "explanation"]):
                        if isinstance(q_data["options"], list) and len(q_data["options"]) == 4 and isinstance(q_data["correct_answer_index"], int):
                             generated_questions_list.append(q_data)
                        else:
                            print(f"Warning: Question has malformed options or correct_answer_index: {q_data.get('question')}")
                    else:
                        print(f"Warning: Question object has missing keys or incorrect type: {q_data}")
            else:
                print(f"Error: LLM response was not in the expected JSON format {{'questions': [...]}}.")
                print(f"Parsed content: {parsed_response}")
                return []

        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from OpenAI response: {e}")
            print(f"Raw content from OpenAI that caused error: {content}")
            return []

        print(f"Successfully generated and parsed {len(generated_questions_list)} questions for the chunk.")
        return generated_questions_list

    except OpenAI.APIError as e: # Updated error handling (example)
        print(f"OpenAI API error: {e.status_code} - {e.message}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred while generating questions: {e}")
        return []

def generate_quiz_from_pdf_stream(
    pdf_bytes: bytes, 
    filename: str, # For logging/context
    start_page: int | None = None, 
    end_page: int | None = None, 
    questions_per_chunk: int = 3, 
    max_total_questions: int = 10
) -> list[dict]:
    """Processes a PDF from a byte stream, generates questions based on page range and parameters."""
    all_generated_questions = []
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        print(f"Error opening PDF stream for '{filename}': {e}")
        return []

    print(f"Processing PDF: {filename}")
    full_text = _extract_text_from_doc(doc, start_page, end_page)
    doc.close()

    if not full_text:
        print(f"No text extracted from '{filename}' based on the specified page range.")
        return []
    
    print(f"Successfully extracted {len(full_text)} characters from '{filename}'.")

    text_chunks = chunk_text(full_text, chunk_size=750, overlap=100) # Assuming chunk_text is defined elsewhere or pasted here
    print(f"Text from '{filename}' divided into {len(text_chunks)} chunks.")

    for i, chunk in enumerate(text_chunks):
        if len(all_generated_questions) >= max_total_questions:
            print(f"Reached maximum of {max_total_questions} questions for '{filename}'. Stopping.")
            break
        print(f"\nProcessing chunk {i+1}/{len(text_chunks)} for '{filename}'...")
        # Assuming generate_questions_from_chunk is defined elsewhere or pasted here
        questions = generate_questions_from_chunk(chunk, num_questions=questions_per_chunk)
        all_generated_questions.extend(questions)
        if len(all_generated_questions) >= max_total_questions:
            all_generated_questions = all_generated_questions[:max_total_questions]
            print(f"Reached maximum of {max_total_questions} questions with this chunk for '{filename}'. Stopping.")
            break
    
    print(f"Finished generating {len(all_generated_questions)} questions for '{filename}'.")
    return all_generated_questions

def main(full_text: str):
    """Main function to process PDF and generate questions (primarily for CLI use if any)."""
    # This function remains largely as it was for CLI, but now full_text is an argument.
    # The API will use generate_quiz_from_pdf_stream directly.

    openai_api_key = os.getenv("OPENAI_API_KEY")

    if not openai_api_key:
        print("Error: OPENAI_API_KEY not found.")
        print("Please ensure it is set in your .env file (e.g., OPENAI_API_KEY='your_key') or as an environment variable.")
        return
    
    # pdf_file_path = "STAT 230 Course Notes (Spring 2025 Edition).pdf" # No longer needed here if full_text is passed
    max_questions_total = 10 # Default for CLI, can be overridden if params are added to main
    questions_per_chunk_cli = 3 # Default for CLI

    print(f"Successfully received {len(full_text)} characters for processing.")

    text_chunks = chunk_text(full_text, chunk_size=750, overlap=100)
    print(f"Text divided into {len(text_chunks)} chunks.")

    all_generated_questions = []

    for i, chunk in enumerate(text_chunks):
        if len(all_generated_questions) >= max_questions_total:
            print(f"Reached maximum of {max_questions_total} questions. Stopping.")
            break
        print(f"\nProcessing chunk {i+1}/{len(text_chunks)}...")
        questions = generate_questions_from_chunk(chunk, num_questions=questions_per_chunk_cli)
        all_generated_questions.extend(questions)
        if len(all_generated_questions) >= max_questions_total:
            all_generated_questions = all_generated_questions[:max_questions_total]
            print(f"Reached maximum of {max_questions_total} questions with this chunk. Stopping.")
            break

    print(f"\n--- Generated {len(all_generated_questions)} Questions Total (CLI Mode) ---")
    for i, q_data in enumerate(all_generated_questions):
        print(f"\nQuestion {i+1}: {q_data['question']}")
        for j, opt in enumerate(q_data['options']):
            print(f"  {chr(65+j)}. {opt}")
        print(f"Correct Answer: {chr(65+q_data['correct_answer_index'])}")
        print(f"Explanation: {q_data['explanation']}")

    print("\nCLI Script finished.")

if __name__ == "__main__":
    # This section is for direct command-line execution of pdf_processor.py
    # It will retain the interactive page number input for CLI use.

    # Check for reportlab for dummy PDF creation if target PDF not found
    target_pdf_cli = "STAT 230 Course Notes (Spring 2025 Edition).pdf" # Default PDF for CLI
    if not os.path.exists(target_pdf_cli):
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.units import inch
            dummy_pdf_name = "sample_cli.pdf"
            c = canvas.Canvas(dummy_pdf_name, pagesize=letter)
            textobject = c.beginText()
            textobject.setTextOrigin(inch, 10*inch)
            textobject.setFont("Helvetica", 12)
            lorem_ipsum = "This is a dummy PDF created for CLI execution because the target PDF was not found."          
            textobject.textLine(lorem_ipsum)
            c.drawText(textobject)
            c.save()
            print(f"Created a dummy '{dummy_pdf_name}' for testing as '{target_pdf_cli}' was not found.")
            target_pdf_cli = dummy_pdf_name # Use the dummy for this run
        except ImportError:
            print(f"Skipped creating dummy PDF: 'reportlab' library not found and target PDF '{target_pdf_cli}' missing.")
        except Exception as e:
            print(f"Could not create dummy PDF: {e}")

    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment.")
        print("Please ensure it is set in your .env file.")
    elif not os.path.exists(target_pdf_cli):
        print(f"Error: Target PDF '{target_pdf_cli}' not found and dummy could not be used. Exiting CLI mode.")
    else:
        start_page_cli: int | None = None
        end_page_cli: int | None = None
        while True:
            try:
                start_input = input("Enter START page for CLI processing (or Enter for beginning): ").strip()
                if not start_input:
                    start_page_cli = None; break
                start_page_cli = int(start_input)
                if start_page_cli <= 0: print("Start page must be positive."); continue
                break
            except ValueError: print("Invalid input.")
        while True:
            try:
                end_input = input("Enter END page for CLI processing (or Enter for end): ").strip()
                if not end_input:
                    end_page_cli = None; break
                end_page_cli = int(end_input)
                if end_page_cli <= 0: print("End page must be positive."); continue
                if start_page_cli is not None and end_page_cli < start_page_cli:
                    print(f"End page ({end_page_cli}) cannot be before start page ({start_page_cli})."); continue
                break
            except ValueError: print("Invalid input.")
        
        print(f"Extracting text from '{target_pdf_cli}' for CLI processing...")
        cli_full_text = extract_text_from_pdf_path(target_pdf_cli, start_page=start_page_cli, end_page=end_page_cli)

        if not cli_full_text:
            print("No text extracted for CLI processing. Exiting.")
        else:
            print(f"Successfully extracted {len(cli_full_text)} characters for CLI processing.")
            main(cli_full_text) # Call main with the extracted text 