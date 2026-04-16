import { Button, Tooltip, TooltipProps } from '@patternfly/react-core';
import { SaveIcon } from '@patternfly/react-icons';

export const defaultTooltipText = 'Save route';

export function DeployRoute() {
  const onClick = () => {
    handleSave();
  };

  const handleSave = async () => {
    const yaml = localStorage.getItem('sourceCode');

    if (!yaml) {
      throw new Error('No route found in localStorage');
    }

    const routeId = new URLSearchParams(window.location.search).get('routeId');

    if (routeId) {
      // Update existing route
      const res = await fetch(`/api/route/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/yaml' },
        body: yaml,
      });
      if (!res.ok) {
        throw new Error(`Save failed: ${res.statusText}`);
      }
    } else {
      // Create new route and navigate to its edit URL
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/yaml' },
        body: yaml,
      });
      if (!res.ok) {
        throw new Error(`Save failed: ${res.statusText}`);
      }
      const newId = await res.text();
      window.location.href = `/?routeId=${encodeURIComponent(newId.trim())}`;
    }
  };

  const tooltipProps: TooltipProps = {
    position: 'bottom',
    content: <div>{defaultTooltipText}</div>,
  };

  return (
    <Tooltip {...tooltipProps}>
      <Button onClick={onClick} variant="control" data-testid="saveRouteButton">
        <SaveIcon />
      </Button>
    </Tooltip>
  );
}
