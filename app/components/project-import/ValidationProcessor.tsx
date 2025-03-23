'use client';

interface ValidationProcessorProps {
  progress: number;
}

export function ValidationProcessor({ progress }: ValidationProcessorProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-medium">Processing file... ({progress}%)</p>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-sm text-gray-500">
        Validating project data, please wait...
      </p>
    </div>
  );
}
