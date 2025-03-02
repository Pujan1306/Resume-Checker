# ResumeAI Scorer

An AI-powered resume scoring tool that analyzes ATS compatibility and implements keyword analysis to enhance job application success rates.

## Features

- **Resume Analysis**: Analyze your resume against specific job descriptions
- **ATS Compatibility Scoring**: Get detailed scores on how well your resume will perform with ATS systems
- **Keyword Analysis**: Identify matched and missing keywords between your resume and job descriptions
- **Improvement Suggestions**: Receive actionable recommendations to enhance your resume's effectiveness

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/resume-scoring-tool.git
cd resume-scoring-tool
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory and add your Gemini API key:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

You can get a Gemini API key from the Google AI Studio: https://makersuite.google.com/app/apikey

### Running the Application

Start the development server:
```
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

```
npm run build
```

## Usage

1. Paste your resume text in the "Resume Text" field
2. Paste the job description in the "Job Description" field
3. Click "Analyze Resume"
4. Review your scores and recommendations

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Vite
- Google Gemini AI

## License

This project is licensed under the MIT License - see the LICENSE file for details.