import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Iterate through each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromDocx(file: File): Promise<string> {
  // In a real implementation, you would use a library like mammoth.js
  // For this demo, we'll just return a message
  return "DOCX parsing would be implemented in a production environment";
}

export async function extractTextFromDoc(file: File): Promise<string> {
  // In a real implementation, you would use a server-side solution
  // For this demo, we'll just return a message
  return "DOC parsing would be implemented in a production environment";
}

export async function extractTextFromTxt(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT');
  }
}

export async function parseResumeFile(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return extractTextFromPDF(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(file);
  } else if (fileType === 'application/msword') {
    return extractTextFromDoc(file);
  } else if (fileType === 'text/plain') {
    return extractTextFromTxt(file);
  } else {
    throw new Error('Unsupported file type');
  }
}