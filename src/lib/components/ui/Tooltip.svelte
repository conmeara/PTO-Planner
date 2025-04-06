<script>
    export let text = '';
    export let html = false;
    export let detailed = false;

    let visible = false;

    function showTooltip() {
        visible = true;
    }

    function hideTooltip() {
        visible = false;
    }
</script>

<style>
    .tooltip-container {
        position: relative;
        display: inline-block;
        width: 100%;
        height: 100%;
        z-index: 100;
    }

    .tooltip {
        position: absolute;
        background-color: #424242;
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 0.9em;
        white-space: nowrap;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tooltip.detailed {
        white-space: normal;
        width: max-content;
        min-width: 180px;
        max-width: 300px;
        padding: 8px 12px;
    }

    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px;
        border-style: solid;
        border-color: #424242 transparent transparent transparent;
    }

    .tooltip-content :global(.highlight) {
        color: #8bc34a;
        font-weight: bold;
    }

    .tooltip-content :global(.highlight-warning) {
        color: #ff9800;
        font-weight: bold;
    }

    .tooltip-content :global(.highlight-danger) {
        color: #ff5722;
        font-weight: bold;
    }

    .tooltip-content :global(.divider) {
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        margin: 4px 0;
    }

    .tooltip-content :global(.label) {
        font-size: 0.8em;
        opacity: 0.8;
    }

    .tooltip-content :global(.value) {
        font-weight: bold;
    }

    .tooltip.visible {
        opacity: 1;
        visibility: visible;
    }
</style>

<div class="tooltip-container" role="tooltip" on:mouseenter={showTooltip} on:mouseleave={hideTooltip}>
    <slot></slot>
    <div class="tooltip {detailed ? 'detailed' : ''} {visible ? 'visible' : ''}">
        {#if html}
            <div class="tooltip-content">
                {@html text}
            </div>
        {:else}
            {text}
        {/if}
    </div>
</div>
