import React from 'react';
import { GithubIcon, MagicWandIcon, PlayIcon, LayoutIcon, DownloadIcon } from './Icons';

interface LoginPageProps {
  onLogin: () => void;
}

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
    <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 flex flex-col items-center text-center h-full transition-all duration-300 hover:bg-black/60 hover:border-[var(--neon-blue)] hover:-translate-y-1">
        <div className="flex-shrink-0">{icon}</div>
        <h3 className="text-lg font-semibold mt-4 mb-2 text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
    </div>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="flex-grow flex flex-col items-center p-8 overflow-y-auto">
      <div className="w-full max-w-5xl text-center flex flex-col items-center min-h-screen justify-center">
        {/* Hero Section */}
        <div className="my-auto">
            <h1 
                className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-white"
                style={{ textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px var(--neon-pink), 0 0 30px var(--neon-pink), 0 0 40px var(--neon-pink), 0 0 55px var(--neon-pink), 0 0 75px var(--neon-pink)' }}
            >
                Build at Lightspeed
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
                Your AI-powered web development sandbox. Go from prompt to production, instantly.
            </p>
            
            {/* CTA Button */}
            <button
                onClick={onLogin}
                className="group relative inline-flex items-center justify-center gap-3 bg-[var(--neon-purple)] hover:bg-[var(--neon-pink)] text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 text-lg shadow-lg hover:shadow-2xl mb-24 neon-glow-purple hover:neon-glow-pink"
            >
                <GithubIcon className="h-7 w-7 transition-transform group-hover:scale-110" />
                <span>Login & Start Building</span>
            </button>
        </div>

        {/* Features Section */}
        <div className="w-full mt-auto pb-16">
            <h2 className="text-3xl font-bold text-white mb-8" style={{textShadow: '0 0 8px var(--neon-blue)'}}>Everything you need to create</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <FeatureCard 
                    icon={<MagicWandIcon className="h-8 w-8 text-[var(--neon-blue)]" />}
                    title="AI-Powered Development"
                    description="Use natural language to generate, modify, and refactor code in real-time."
                />
                <FeatureCard 
                    icon={<PlayIcon className="h-8 w-8 text-[var(--neon-green)]" />}
                    title="Instant Live Preview"
                    description="See your changes rendered instantly in a live, interactive preview pane."
                />
                <FeatureCard 
                    icon={<LayoutIcon className="h-8 w-8 text-[var(--neon-pink)]" />}
                    title="Component & Layouts"
                    description="Drag-and-drop components or apply full-page templates to kickstart your project."
                />
                <FeatureCard 
                    icon={<DownloadIcon className="h-8 w-8 text-gray-300" />}
                    title="Export & Deploy"
                    description="Download your entire project as a ZIP file to host it anywhere you like."
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;