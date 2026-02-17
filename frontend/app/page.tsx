import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <h1 className="text-5xl font-extrabold mb-6 text-center">
        Chess <span className="text-blue-500">Live</span> Stream
      </h1>
      
      <p className="text-xl text-slate-400 mb-8 max-w-2xl text-center">
        Вставьте PGN вашей партии и превратите её в интерактивную трансляцию 
        с профессиональной доской Chessground.
      </p>

      <div className="flex gap-4">
        {/* Ссылка на будущую страницу создания трансляции */}
        <Link 
          href="/new" 
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-all"
        >
          Создать трансляцию
        </Link>
        
        <button className="border border-slate-700 hover:bg-slate-800 px-8 py-3 rounded-lg font-semibold transition-all">
          Смотреть демо
        </button>
      </div>

      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard title="Анализ" description="Поддержка движка Stockfish для оценки позиций." />
        <FeatureCard title="Скорость" description="Минимальная задержка благодаря Next.js 15+." />
        <FeatureCard title="UI" description="Интерфейс, к которому привыкли игроки Lichess." />
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 border border-slate-800 rounded-xl bg-slate-800/50">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
