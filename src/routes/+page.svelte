<script lang="ts">
    import { onMount } from 'svelte';
    import Header from '../lib/components/layout/Header.svelte';
    import Footer from '../lib/components/layout/Footer.svelte';
    import HowItWorks from '../lib/components/layout/HowItWorks.svelte';
    import SettingsPanel from '../lib/components/settings/SettingsPanel.svelte';
    import CalendarGrid from '../lib/components/calendar/CalendarGrid.svelte';
    import { selectedCountry, selectedCountryCode } from '../lib/stores/holidayStore';

    let showHowItWorks = false;

    function toggleHowItWorks() {
        showHowItWorks = !showHowItWorks;
    }

    async function fetchCountryCode() {
        try {
            // Skip the fetch in development mode to avoid CORS issues
            if (window.location.hostname === 'localhost') {
                // Set a default country code for local development
                if (!$selectedCountryCode) {
                    import('i18n-iso-countries').then(countries => {
                        import('i18n-iso-countries/langs/en.json').then(enLocale => {
                            countries.registerLocale(enLocale);
                            const countriesList = countries.getNames('en');
                            // Default to US for local development
                            selectedCountry.set(countriesList['US'] || 'United States');
                            selectedCountryCode.set('US');
                        });
                    });
                }
                return;
            }

            // Only run this in production
            const response = await fetch('https://stretchmytimeoff.com/cdn-cgi/trace');
            const text = await response.text();
            const countryCodeMatch = text.match(/loc=(\w+)/);
            const countryCode = countryCodeMatch ? countryCodeMatch[1] : '';

            if (countryCode && !$selectedCountryCode) {
                // Only set if not already set from localStorage
                import('i18n-iso-countries').then(countries => {
                    import('i18n-iso-countries/langs/en.json').then(enLocale => {
                        countries.registerLocale(enLocale);
                        const countriesList = countries.getNames('en');
                        selectedCountry.set(countriesList[countryCode] || '');
                        selectedCountryCode.set(countryCode);
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching country code:', error);
            // Fallback to US if there's an error
            if (!$selectedCountryCode) {
                import('i18n-iso-countries').then(countries => {
                    import('i18n-iso-countries/langs/en.json').then(enLocale => {
                        countries.registerLocale(enLocale);
                        const countriesList = countries.getNames('en');
                        selectedCountry.set(countriesList['US'] || 'United States');
                        selectedCountryCode.set('US');
                    });
                });
            }
        }
    }

    onMount(() => {
        fetchCountryCode();
    });
</script>

<main>
    <Header {toggleHowItWorks} />

    <div class="content-box">
        <SettingsPanel />
        <CalendarGrid />
    </div>

    {#if showHowItWorks}
        <HowItWorks />
    {/if}
</main>

<Footer />

<style>
    .content-box {
        max-width: 1200px;
        margin: 20px auto;
        padding: 15px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }
</style>
