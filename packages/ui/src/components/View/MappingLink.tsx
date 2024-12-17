import {
  CSSProperties,
  FunctionComponent,
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { useDataMapper } from '../../hooks/useDataMapper';
import { NodeReference } from '../../providers/datamapper-canvas.provider';
import { MappingService } from '../../services/mapping.service';
import { Circle, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

type LineCoord = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type LineProps = LineCoord & {
  sourceNodePath: string;
  targetNodePath: string;
  svgRef?: RefObject<SVGSVGElement>;
};

const MappingLink: FunctionComponent<LineProps> = ({ x1, y1, x2, y2, sourceNodePath, targetNodePath, svgRef }) => {
  const { mappingLinkCanvasRef } = useCanvas();
  const [isOver, setIsOver] = useState<boolean>(false);
  const lineStyle = {
    stroke: 'gray',
    strokeWidth: isOver ? 6 : 3,
    pointerEvents: 'auto' as CSSProperties['pointerEvents'],
  };
  const dotRadius = isOver ? 6 : 3;
  const svgRect = svgRef?.current?.getBoundingClientRect();
  const canvasRect = mappingLinkCanvasRef?.current?.getBoundingClientRect();
  const canvasLeft = canvasRect ? canvasRect.left - (svgRect ? svgRect.left : 0) : undefined;
  const canvasRight = canvasRect ? canvasRect.right - (svgRect ? svgRect.left : 0) : undefined;

  const onMouseEnter = useCallback(() => {
    setIsOver(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  return (
    <>
      <Circle r={dotRadius} cx={x1} cy={y1} />
      <LinePath<[number, number]>
        data={[
          [x1, y1],
          [canvasLeft ? canvasLeft : x1, y1],
          [canvasRight ? canvasRight : x2, y2],
          [x2, y2],
        ]}
        x={(d) => d[0]}
        y={(d) => d[1]}
        curve={curveMonotoneX}
        style={lineStyle}
        onClick={() => {}}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid={`mapping-link-${x1}-${y1}-${x2}-${y2}`}
        xlinkTitle={`Source: ${sourceNodePath}, Target: ${targetNodePath}`}
      />
      <Circle r={dotRadius} cx={x2} cy={y2} />
    </>
  );
};

export const MappingLinksContainer: FunctionComponent = () => {
  const { mappingTree, sourceBodyDocument, sourceParameterMap } = useDataMapper();
  const [lineCoordList, setLineCoordList] = useState<LineProps[]>([]);
  const { getNodeReference } = useCanvas();
  const svgRef = useRef<SVGSVGElement>(null);

  const getCoordFromFieldRef = useCallback(
    (sourceRef: MutableRefObject<NodeReference>, targetRef: MutableRefObject<NodeReference>) => {
      const svgRect = svgRef.current?.getBoundingClientRect();
      const sourceRect = sourceRef.current?.headerRef?.getBoundingClientRect();
      const targetRect = targetRef.current?.headerRef?.getBoundingClientRect();
      if (!sourceRect || !targetRect) {
        return;
      }

      return {
        x1: sourceRect.right - (svgRect ? svgRect.left : 0),
        y1: sourceRect.top + (sourceRect.bottom - sourceRect.top) / 2 - (svgRect ? svgRect.top : 0),
        x2: targetRect.left - (svgRect ? svgRect.left : 0),
        y2: targetRect.top + (targetRect.bottom - targetRect.top) / 2 - (svgRect ? svgRect.top : 0),
      };
    },
    [],
  );

  const getParentPath = useCallback((path: string) => {
    if (path.endsWith('://')) return path.substring(0, path.indexOf(':'));

    const lastSeparatorIndex = path.lastIndexOf('/');
    const endIndex =
      lastSeparatorIndex !== -1 && path.charAt(lastSeparatorIndex - 1) === '/'
        ? lastSeparatorIndex + 1
        : lastSeparatorIndex;
    return endIndex !== -1 ? path.substring(0, endIndex) : null;
  }, []);

  const getClosestExpandedPath = useCallback(
    (path: string) => {
      let tracedPath: string | null = path;
      while (
        !!tracedPath &&
        (getNodeReference(tracedPath)?.current == null ||
          getNodeReference(tracedPath)?.current.headerRef == null ||
          getNodeReference(tracedPath)?.current.headerRef?.getClientRects().length === 0)
      ) {
        const parentPath = getParentPath(tracedPath);
        if (parentPath === tracedPath) break;
        tracedPath = parentPath;
      }
      return tracedPath;
    },
    [getNodeReference, getParentPath],
  );

  const refreshLinks = useCallback(() => {
    const links = MappingService.extractMappingLinks(mappingTree, sourceParameterMap, sourceBodyDocument);
    const answer: LineProps[] = links.reduce((acc, { sourceNodePath, targetNodePath }) => {
      const sourceClosestPath = getClosestExpandedPath(sourceNodePath);
      const targetClosestPath = getClosestExpandedPath(targetNodePath);
      if (sourceClosestPath && targetClosestPath) {
        const sourceFieldRef = getNodeReference(sourceClosestPath);
        const targetFieldRef = getNodeReference(targetClosestPath);
        if (sourceFieldRef && !!targetFieldRef) {
          const coord = getCoordFromFieldRef(sourceFieldRef, targetFieldRef);
          if (coord) acc.push({ ...coord, sourceNodePath: sourceNodePath, targetNodePath: targetNodePath });
        }
      }
      return acc;
    }, [] as LineProps[]);
    setLineCoordList(answer);
  }, [
    mappingTree,
    sourceParameterMap,
    sourceBodyDocument,
    getClosestExpandedPath,
    getNodeReference,
    getCoordFromFieldRef,
  ]);

  useEffect(() => {
    refreshLinks();
    window.addEventListener('resize', refreshLinks);
    window.addEventListener('scroll', refreshLinks);
    return () => {
      window.removeEventListener('resize', refreshLinks);
      window.removeEventListener('scroll', refreshLinks);
    };
  }, [refreshLinks]);

  return (
    <svg
      ref={svgRef}
      data-testid="mapping-links"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <g z={0}>
        {lineCoordList.map((lineProps, index) => (
          <MappingLink
            key={index}
            svgRef={svgRef}
            x1={lineProps.x1}
            y1={lineProps.y1}
            x2={lineProps.x2}
            y2={lineProps.y2}
            sourceNodePath={lineProps.sourceNodePath}
            targetNodePath={lineProps.targetNodePath}
          />
        ))}
      </g>
    </svg>
  );
};
