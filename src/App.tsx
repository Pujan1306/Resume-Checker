import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, CheckCircle, AlertCircle, Briefcase, FileSearch, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeResumeWithGemini, AnalysisResult } from './services/geminiService';
import { parseResumeFile } from './utils/fileParser';

function App() {
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        setUploadStatus('Please upload a supported file format (PDF, DOC, DOCX, TXT)');
        return;
      }
      
      const file = acceptedFiles[0];
      setIsUploading(true);
      setUploadStatus(`Processing ${file.name}...`);
      
      try {
        const extractedText = await parseResumeFile(file);
        setResumeText(extractedText);
        setUploadStatus(`Successfully processed ${file.name}`);
      } catch (error) {
        console.error('Error processing file:', error);
        setUploadStatus(`Failed to process ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    },
  });

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      alert('Please provide both resume text and job description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeResumeWithGemini(resumeText, jobDescription);
      setResult(result);
      setActiveTab('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ScoreGauge = ({ score }: { score: number }) => {
    const color = score >= 80 
      ? 'text-green-500' 
      : score >= 60 
        ? 'text-yellow-500' 
        : 'text-red-500';
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="#e6e6e6" 
              strokeWidth="10" 
            />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'} 
              strokeWidth="10" 
              strokeDasharray={`${score * 2.83} 283`} 
              strokeLinecap="round" 
              transform="rotate(-90 50 50)" 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${color}`}>{score}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <FileSearch className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">ResumeAI Scorer</h1>
          </div>
          <div className="text-sm text-gray-500">AI-Powered Resume Analysis</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Analyze
                </div>
              </button>
              <button
                onClick={() => setActiveTab('results')}
                disabled={!result}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'results' && result
                    ? 'border-indigo-500 text-indigo-600'
                    : !result
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Results
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'upload' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Resume Text</h2>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume text here..."
                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="w-64 flex flex-col space-y-4">
                      <div
                        {...getRootProps()}
                        className={`flex-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 ${
                          isUploading ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 border-dashed'
                        } rounded-md cursor-pointer hover:bg-gray-50`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center">
                          {isUploading ? (
                            <>
                              <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <p className="mt-2 text-sm text-indigo-600">Processing file...</p>
                            </>
                          ) : (
                            <>
                              <FileText className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-600">
                                Drag & drop a file or click to upload
                              </p>
                              <p className="text-xs text-gray-500">
                                PDF, DOC, DOCX, TXT
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {uploadStatus && (
                        <div className={`p-4 rounded-md ${
                          uploadStatus.includes('Failed') 
                            ? 'bg-red-50 text-red-800' 
                            : uploadStatus.includes('Successfully') 
                              ? 'bg-green-50 text-green-800'
                              : 'bg-yellow-50 text-yellow-800'
                        }`}>
                          <p className="text-sm">{uploadStatus}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Job Description</h2>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !resumeText || !jobDescription}
                    className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                      isAnalyzing || !resumeText || !jobDescription
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing with Gemini AI...
                      </div>
                    ) : (
                      'Analyze Resume with Gemini AI'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              result && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analysis Results</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                      Based on Gemini 1.5 AI analysis of your resume against the job description
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Overall ATS Score</h3>
                      <ScoreGauge score={result.overallScore} />
                      <p className="mt-2 text-sm text-gray-500">
                        {result.overallScore >= 80
                          ? 'Excellent! Your resume is ATS-friendly.'
                          : result.overallScore >= 60
                          ? 'Good, but could use some improvements.'
                          : 'Needs significant improvements to pass ATS systems.'}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Keyword Match</h3>
                      <ScoreGauge score={result.keywordMatchScore} />
                      <p className="mt-2 text-sm text-gray-500">
                        {result.keywordMatchScore >= 80
                          ? 'Excellent keyword matching!'
                          : result.keywordMatchScore >= 60
                          ? 'Good keyword usage, but could be improved.'
                          : 'Add more relevant keywords from the job description.'}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Format Score</h3>
                      <ScoreGauge score={result.formatScore} />
                      <p className="mt-2 text-sm text-gray-500">
                        {result.formatScore >= 80
                          ? 'Your resume format is ATS-friendly.'
                          : result.formatScore >= 60
                          ? 'Format is acceptable but could be improved.'
                          : 'Consider using a more ATS-friendly format.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Matched Keywords
                      </h3>
                      {result.matchedKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {result.matchedKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No keywords matched. Try adding relevant terms from the job description.</p>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        Missing Keywords
                      </h3>
                      {result.missingKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {result.missingKeywords.slice(0, 15).map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                            >
                              {keyword}
                            </span>
                          ))}
                          {result.missingKeywords.length > 15 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              +{result.missingKeywords.length - 15} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Great job! You've included all important keywords.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Briefcase className="h-5 w-5 text-indigo-500 mr-2" />
                      AI-Generated Improvement Suggestions
                    </h3>
                    <ul className="space-y-2">
                      {result.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 text-indigo-500 mr-2">•</span>
                          <span className="text-gray-700">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit Resume & Job Description
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-lg font-medium text-indigo-900">How It Works</h2>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <ReactMarkdown>
                {`
## How ResumeAI Scorer Works

Our AI-powered resume scoring tool analyzes your resume against specific job descriptions to maximize your chances of getting past Applicant Tracking Systems (ATS) and landing interviews.

### The Analysis Process

1. **Keyword Matching**: We use Google's Gemini 1.5 AI to identify important keywords and phrases from the job description and check if they appear in your resume.

2. **Format Analysis**: The AI evaluates your resume's structure, headings, and overall format for ATS compatibility.

3. **Overall ATS Score**: We calculate a comprehensive score based on keyword matching and formatting factors.

4. **AI-Generated Suggestions**: Gemini 1.5 provides personalized recommendations to improve your resume for the specific job.

### Tips for Improving Your Score

- **Customize for each job**: Tailor your resume for each specific position.
- **Use relevant keywords**: Include industry-specific terms and skills mentioned in the job description.
- **Maintain clean formatting**: Use standard section headings and avoid complex design elements.
- **Quantify achievements**: Use numbers and metrics to demonstrate your impact.
- **Focus on relevance**: Prioritize recent and relevant experience.
                `}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © 2025 ResumeAI Scorer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;