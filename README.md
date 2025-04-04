# Stretch My Time Off

**Stretch My Time Off** is a tool designed to help you optimize your vacation days by aligning public holidays and personal leave. This project was generated entirely with ChatGPT in a code editor designed for AI-assisted development.

Website: https://stretchmytimeoff.com

![Stretch My Time Off](screenshot.png)

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Algorithm](#algorithm)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About the Project

This project was created to efficiently manage vacation days by aligning them with public holidays. It was developed using the Cursor IDE with GPT-4o and is hosted on Vercel with Cloudflare.

## Features

- **Country-Specific Holidays**: Fetches public holidays for your country.
- **Optimized Days Off**: Calculates the best use of personal leave days.
- **PTO Strategies**: Multiple optimization strategies tailored for different needs:
  - **Balanced Mix**: Distributes PTO evenly throughout the year
  - **Long Weekends**: Focuses on extending weekends with 1-2 days off
  - **Mini Breaks**: Creates multiple 5-6 day breaks throughout the year
  - **Week-Long Breaks**: Organizes PTO for 7-9 day vacation periods
  - **Extended Vacations**: Plans for one or two 10-15 day vacation periods
- **Interactive Calendar**: Visualizes holidays and optimized days off.
- **Responsive Design**: Compatible with desktop and mobile devices.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (v2.0.0)
- **UI/Component Library**: Svelte (v5.0.0)
- **Programming Languages**: TypeScript (v5.0.0), JavaScript
- **Styling**: CSS
- **Package Manager**: npm
- **Build Tool**: Vite (v5.0.3)
- **Type Checking**: svelte-check (v4.0.0)
- **Date & Holidays Library**: date-holidays (v3.23.12)
- **Internationalization**: i18n-iso-countries (v7.13.0)
- **Hosting**: [Vercel](https://vercel.com/)
- **CDN and Security**: [Cloudflare](https://www.cloudflare.com/)
- **IDE**: [Cursor IDE](https://cursor.so/)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zachd/stretch-my-time-off.git
   ```

2. **Navigate to the project directory**:
   ```bash
   cd stretch-my-time-off
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

Access the application at `http://localhost:3000`. Enter your country to view public holidays and plan your time off using the interactive calendar.

## Algorithm

The application offers multiple algorithms to optimize personal leave days:

1. **Identify Public Holidays and Weekends**.
2. **Apply Selected Strategy**:
   - For long weekends: Find 1-2 day gaps adjacent to holidays/weekends
   - For mini breaks: Look for clusters that can extend to 5-6 days
   - For week-long breaks: Prioritize gaps around existing clusters
   - For extended vacations: Focus on 1-2 periods for longer breaks
3. **Find Gaps** between days off based on strategy.
4. **Rank Gaps** by efficiency and strategy preferences.
5. **Select Days Off** to fill gaps according to strategy.
6. **Calculate Consecutive Days Off**.

```mermaid
graph TD;
    A[Start] --> B[Identify Public Holidays and Weekends]
    B --> C1[Select PTO Strategy]
    C1 --> C2[Find Gaps Based on Strategy]
    C2 --> D[Rank Gaps by Strategy Preference]
    D --> E[Select Days Off to Fill Gaps]
    E --> F[Calculate Consecutive Days Off]
    F --> G[End]
```

## Contributing

Contributions are welcome! Open an issue or submit a pull request for improvements or new features.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments

- **SvelteKit**: For the framework.
- **Vercel**: For hosting.
- **Cloudflare**: For CDN and security.
- **Cursor IDE and GPT-4o**: For development assistance.

---

**Disclaimer**: This project was 100% generated with ChatGPT out of pure interest, using a code editor designed for AI-assisted development.
