<script lang="ts">
    import { consecutiveDaysOff, daysOff } from '../../stores/holidayStore';

    export let toggleHowItWorks: () => void;
</script>

<div class="header">
    <h2>🌴 Stretch&nbsp;My Time&nbsp;Off</h2>
    <p>
        Let's stretch your time off from <strong>{$daysOff}&nbsp;days</strong> to <strong>{$consecutiveDaysOff.reduce((total, group) => total + group.totalDays, 0)}&nbsp;days</strong> (<a href="#how-it-works" on:click={toggleHowItWorks}>how?</a>)
    </p>
</div>

<style>
    .header {
        max-width: 800px;
        margin: 20px auto;
        padding: 0 30px;
        text-align: center;
    }

    .header h2 {
        font-size: 2.3rem;
        margin: 0;
    }

    p {
        line-height: 1.6;
    }

    a {
        color: #2196F3;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>
