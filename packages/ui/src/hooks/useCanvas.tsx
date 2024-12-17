import { CanvasContext, ICanvasContext } from '../providers/datamapper-canvas.provider';
import { useContext } from 'react';

export const errorMessage = 'useCanvas should be called into CanvasProvider';

export const useCanvas = (): ICanvasContext => {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error(errorMessage);
  return ctx;
};
