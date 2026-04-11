import { Signal, Circle, Ban, Construction, Camera, CheckCircle, XCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils.js';
import { geocodeDestination, submitObstacleReport } from '../../lib/api.js';

export default function ReportScreen({ authToken, isAuthenticated, onRequireAuth }) {
  const [selectedObstacle, setSelectedObstacle] = useState(null);
  const [isPassable, setIsPassable] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [locationMode, setLocationMode] = useState('gps');
  const [manualLocation, setManualLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const obstacles = [
    { id: 'stairs', label: 'Stairs', icon: Signal },
    { id: 'pothole', label: 'Pothole', icon: Circle },
    { id: 'narrow_path', label: 'Blocked / Narrow', icon: Ban },
    { id: 'construction', label: 'Construction', icon: Construction },
  ];

  const submitReport = async () => {
    if (!isAuthenticated || !authToken) {
      onRequireAuth();
      setError('Please login to submit a report.');
      return;
    }
    if (!selectedObstacle) {
      setError('Please choose an obstacle type.');
      return;
    }
    if (isPassable === null) {
      setError('Please mark if the segment is accessible or not.');
      return;
    }
    if (locationMode === 'manual' && !manualLocation.trim()) {
      setError('Please enter a manual location or switch back to GPS.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const location = await new Promise((resolve, reject) => {
        if (locationMode === 'manual') {
          geocodeDestination(manualLocation.trim())
            .then((locationData) => {
              resolve({
                type: 'Point',
                coordinates: locationData.coordinates,
              });
            })
            .catch(reject);
          return;
        }

        if (!navigator.geolocation) {
          reject(new Error('Location access is required for reporting obstacles. You can also enter a location manually.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude],
            });
          },
          async () => {
            if (!manualLocation.trim()) {
              reject(new Error('Location access is required for reporting obstacles. You can also enter a location manually.'));
              return;
            }

            try {
              const locationData = await geocodeDestination(manualLocation.trim());
              resolve({
                type: 'Point',
                coordinates: locationData.coordinates,
              });
            } catch (geocodeError) {
              reject(geocodeError);
            }
          },
          { enableHighAccuracy: true, timeout: 12000 }
        );
      });

      await submitObstacleReport(
        {
          obstacleType: selectedObstacle,
          location,
          severity: isPassable ? 'medium' : 'high',
          imageUrl: imageUrl || undefined,
          notes: notes || undefined,
        },
        authToken
      );

      setIsSubmitted(true);
      setSelectedObstacle(null);
      setIsPassable(null);
      setLocationMode('gps');
      setManualLocation('');
      setNotes('');
      setImageUrl('');
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center mt-20">
        <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center mb-6 text-on-primary">
          <Check className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-on-surface mb-2">Report Received!</h3>
        <p className="text-on-surface-variant font-medium">Thanks. Your report is now live in route safety scoring for nearby users.</p>
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

        <div className="rounded-3xl bg-surface-container-lowest p-4 sm:p-5 shadow-[0px_12px_32px_rgba(25,28,29,0.06)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-sm sm:text-base">Location mode</h3>
            <div className="bg-surface-container flex rounded-2xl p-1">
              <button
                onClick={() => setLocationMode('gps')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
                  locationMode === 'gps' ? 'bg-primary text-on-primary' : 'text-outline'
                )}
              >
                Use GPS
              </button>
              <button
                onClick={() => setLocationMode('manual')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
                  locationMode === 'manual' ? 'bg-primary text-on-primary' : 'text-outline'
                )}
              >
                Manual
              </button>
            </div>
          </div>

          {locationMode === 'manual' && (
            <div className="space-y-3">
              <input
                className="w-full bg-surface-container rounded-2xl px-4 py-3 outline-none"
                placeholder="Enter location manually (example: 4th & King St intersection)"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
              />
              <p className="text-xs text-outline font-medium">
                We will geocode this location and store it as a map point for crowd safety scoring.
              </p>
            </div>
          )}
        </div>

        <input
          className="w-full bg-surface-container-lowest rounded-2xl px-4 py-3 outline-none"
          placeholder="Optional image URL (proof)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <textarea
          className="w-full bg-surface-container-lowest rounded-2xl px-4 py-3 outline-none min-h-24 resize-y"
          placeholder="Optional notes for the accessibility team"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
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

      {error && <p className="mb-4 text-sm font-semibold text-error">{error}</p>}

      <button
        onClick={submitReport}
        disabled={isSubmitting}
        className="w-full movement-gradient py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] text-on-primary text-lg sm:text-xl font-black tracking-tight shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  );
}
