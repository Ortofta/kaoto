import { Button, Tooltip, TooltipProps } from '@patternfly/react-core';
import { RouteIcon } from '@patternfly/react-icons';

export const defaultTooltipText = 'Deploy route';

export function DeployRoute() {

    const onClick = () => {
        handlePostData()
    };
  
    const handlePostData = async () => {
        const dataFromLocalStorage = localStorage.getItem('sourceCode');
        console.log(dataFromLocalStorage)
        
        if (!dataFromLocalStorage) {
            throw new Error('No route found in localStorage');
        }

        // Send a POST request to the API
        const res = await fetch('/api/route', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/yaml',
            },
            body: dataFromLocalStorage,
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.statusText}`);
        }

        await res.json();
    };

    const tooltipProps: TooltipProps = {
        position: 'bottom',
        content: <div>{defaultTooltipText}</div>,
    };

    return (
        <Tooltip {...tooltipProps}>
        <Button onClick={onClick} variant="control" data-testid="exportImageButton">
            <RouteIcon />
        </Button>
        </Tooltip>
    );
}