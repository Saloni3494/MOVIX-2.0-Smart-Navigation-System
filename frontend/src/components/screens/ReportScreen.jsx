import { Signal, Circle, Ban, Construction, Camera, CheckCircle, XCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils.js';

export default function ReportScreen() {
  const [selectedObstacle, setSelectedObstacle] = useState(null);
  const [isPassable, setIsPassable] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const obstacles = [
    { id: 'stairs', label: 'Stairs', icon: Signal },
    { id: 'pothole', label: 'Pothole', icon: Circle },
    { id: 'blocked', label: 'Blocked', icon: Ban },
    { id: 'construction', label: 'Construction', icon: Construction },
  ];

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center mt-20">
        <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center mb-6 text-on-primary">
          <Check className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-on-surface mb-2">Report Received!</h3>
        <p className="text-on-surface-variant font-medium">You just helped 14 nearby users avoid this obstacle. Thank you!</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-8 text-primary font-bold hover:underline"
        >
          Back to Reporting
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <section className="mb-8 sm:mb-10">
        <h2 className="text-primary font-headline text-2xl sm:text-3xl font-black tracking-tight mb-2">Report an Obstacle</h2>
        <p className="text-outline font-medium leading-relaxed text-sm sm:text-base">Help the community by marking barriers in real-time. Your contribution makes the world more accessible.</p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {obstacles.map((obs) => (
          <button
            key={obs.id}
            onClick={() => setSelectedObstacle(obs.id)}
            className={cn(
              "flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl sm:rounded-[2rem] transition-all group active:scale-95",
              selectedObstacle === obs.id
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-low hover:bg-surface-container-highest"
            )}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center mb-3 sm:mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <obs.icon className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <span className="font-bold text-sm sm:text-base">{obs.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
        <div className="bg-surface-container-lowest rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 shadow-[0px_12px_32px_rgba(25,28,29,0.06)] flex items-center gap-4 sm:gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1">Evidence</h3>
            <p className="text-outline text-xs sm:text-sm">Add a photo to help others identify the obstacle clearly.</p>
          </div>
          <button className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl movement-gradient flex items-center justify-center text-on-primary shadow-lg active:scale-90 transition-transform flex-shrink-0">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        <div className="bg-surface-container-low rounded-3xl sm:rounded-[2.5rem] p-2 flex items-center gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.8rem] overflow-hidden flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              src="https://picsum.photos/seed/location-map/200/200"
              alt="Location Map"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 pr-2 sm:pr-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Auto-Tagged</span>
              <button className="text-primary font-bold text-xs sm:text-sm">Change</button>
            </div>
            <p className="font-bold text-on-surface leading-tight text-sm sm:text-base">4th & King St intersection</p>
            <p className="text-outline text-xs sm:text-sm">Accuracy: 3 meters</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-highest/50 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 mb-8 sm:mb-10">
        <h3 className="font-bold mb-3 sm:mb-4 text-center text-sm sm:text-base">Is this segment still passable?</h3>
        <div className="flex p-1 bg-surface-container-low rounded-2xl">
          <button
            onClick={() => setIsPassable(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-bold transition-all text-xs sm:text-sm",
              isPassable === true
                ? "bg-primary-fixed text-on-primary-fixed shadow-sm"
                : "text-outline"
            )}
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Accessible
          </button>
          <button
            onClick={() => setIsPassable(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-bold transition-all text-xs sm:text-sm",
              isPassable === false
                ? "bg-primary-fixed text-on-primary-fixed shadow-sm"
                : "text-outline"
            )}
          >
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Not Accessible
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsSubmitted(true)}
        className="w-full movement-gradient py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] text-on-primary text-lg sm:text-xl font-black tracking-tight shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
      >
        Submit Report
      </button>
    </div>
  );
}
