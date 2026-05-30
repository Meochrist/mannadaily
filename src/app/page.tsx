import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6">
      <h1 className="text-5xl font-extrabold mb-4 tracking-tight">MannaDaily</h1>
      <p className="text-lg text-indigo-100 max-w-md text-center mb-8">
        Une application ludique et interactive pour nourrir votre âme au quotidien.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/login" 
          className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl shadow-lg hover:bg-indigo-50 transition"
        >
          Se connecter
        </Link>
        <Link 
          href="/register" 
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg border border-indigo-500 hover:bg-indigo-700 transition"
        >
          S'inscrire
        </Link>
      </div>
    </div>
  );
}
