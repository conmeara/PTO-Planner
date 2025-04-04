<script>
    export let text = '';
</script>

<style>
    .tooltip {
        position: absolute;
        background-color: #424242;
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 0.9em;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s ease, visibility 0.15s ease;
        bottom: 130%;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
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
</style>

<div class="tooltip">
    {text}
</div>
