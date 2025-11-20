import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '../game/Engine';
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCALE } from '../constants';
import { geminiService } from '../services/geminiService';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'MENU' | 'PLAYING' | 'GAME_OVER' | 'WIN'>('MENU');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    engineRef.current = new Engine(canvasRef.current);

    engineRef.current.onScoreChange = (s) => setScore(s);
    engineRef.current.onGameOver = () => setStatus('GAME_OVER');
    engineRef.current.onWin = () => setStatus('WIN');

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const startGame = async (useAI: boolean) => {
    setLoading(true);
    setStatus('PLAYING');
    setScore(0);
    
    try {
      const levelData = await geminiService.generateLevel();
      engineRef.current?.loadLevel(levelData);
    } catch (e) {
      console.error(e);
      // Fallback handled in service, but just in case
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-[768px] mb-2 text-white font-bold text-xl uppercase">
        <div>MARIO<br/>{score.toString().padStart(6, '0')}</div>
        <div>WORLD<br/>1-1</div>
        <div>TIME<br/>300</div>
      </div>

      {/* Game Container */}
      <div className="relative border-4 border-white rounded-sm shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          className="block"
          style={{ width: `${SCREEN_WIDTH * SCALE}px`, height: `${SCREEN_HEIGHT * SCALE}px` }}
        />

        {/* Overlays */}
        {(status === 'MENU' || status === 'GAME_OVER' || status === 'WIN') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-8 z-10">
            <h1 className="text-4xl md:text-6xl text-yellow-400 mb-8 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
              {status === 'MENU' ? 'SUPER GENAI BROS' : status === 'WIN' ? 'COURSE CLEAR!' : 'GAME OVER'}
            </h1>

            {status === 'WIN' && <p className="mb-8 text-green-400">Great job! Try a new AI level?</p>}
            
            <div className="flex flex-col gap-4 w-64">
               <button
                onClick={() => startGame(false)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded border-b-4 border-red-800 active:border-b-0 active:mt-1 font-bold"
              >
                {loading ? 'LOADING...' : 'PLAY (DEFAULT)'}
              </button>
              
              <button
                onClick={() => startGame(true)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded border-b-4 border-blue-800 active:border-b-0 active:mt-1 font-bold flex items-center justify-center gap-2 group"
              >
                <span>✨</span>
                {loading ? 'GENERATING...' : 'GENERATE NEW LEVEL'}
              </button>
            </div>
            
            <div className="mt-8 text-xs text-gray-400 space-y-2">
                <p>CONTROLS:</p>
                <div className="flex gap-4 justify-center">
                    <span>⬅️ ➡️ MOVE</span>
                    <span>SPACE / ⬆️ JUMP</span>
                </div>
            </div>
          </div>
        )}
        
        {loading && status === 'PLAYING' && (
            <div className="absolute inset-0 bg-black flex items-center justify-center text-white">
                <div className="text-xl animate-pulse">GENERATING WORLD...</div>
            </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-xs max-w-lg">
        <p>Powered by Google Gemini API. Click "Generate New Level" to create a unique course on the fly.</p>
      </div>
    </div>
  );
};