import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-8">
          AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Ace Your Next Interview
        </h1>
        <p className="text-lg text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
          Practice with an AI interviewer tailored to your target company, role,
          and level. Get real-time feedback and improve your performance.
        </p>
        <Link
          href="/setup"
          className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        >
          Start Interview
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-blue-400 font-semibold mb-2">
              Company-Specific
            </div>
            <p className="text-sm text-gray-400">
              Questions tailored to Meta, Google, and Amazon interview styles.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-blue-400 font-semibold mb-2">
              Multiple Formats
            </div>
            <p className="text-sm text-gray-400">
              Coding, system design, behavioral, ML design, and AI-native
              coding.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
            <div className="text-blue-400 font-semibold mb-2">
              Real-Time Feedback
            </div>
            <p className="text-sm text-gray-400">
              Get instant feedback and detailed scoring on your responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
