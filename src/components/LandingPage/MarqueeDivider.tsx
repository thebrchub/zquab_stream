export default function MarqueeDivider() {
  const content = (
    <div className="flex items-center gap-8 px-4 text-xl md:text-2xl font-black uppercase tracking-widest text-white">
      <span>Watch Live</span> <span className="text-indigo-300">✦</span> 
      <span>Talk 1:1</span> <span className="text-indigo-300">✦</span> 
      <span>Meet Strangers</span> <span className="text-indigo-300">✦</span> 
      <span>Support Creators</span> <span className="text-indigo-300">✦</span>
    </div>
  );

  return (
    <div className="w-full py-4 bg-indigo-600 overflow-hidden flex items-center border-y border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.15)] group">
      
      {/* 
        The animate-marquee class slides this container left. 
        group-hover pauses it so users can read it if they want.
        w-max ensures the container is exactly as wide as its contents.
      */}
      <div className="flex whitespace-nowrap w-max animate-marquee group-hover:[animation-play-state:paused]">
        {/* We render the exact same content twice to create a seamless loop */}
        {content}
        {content}
        {content}
        {content}
      </div>
      
    </div>
  );
}