export interface SampleJd {
  label: string;
  text: string;
}

/**
 * Three realistic, keyword-rich job descriptions used by the
 * "Load a sample job description" button. Cycled in order.
 */
export const SAMPLE_JDS: SampleJd[] = [
  {
    label: "Senior Frontend Engineer @ Vercel",
    text: `Senior Frontend Engineer — Vercel (Remote, full-time)

About the role
Vercel is the platform for frontend developers to build, preview, and ship the best web experiences. We are looking for a Senior Frontend Engineer to push the boundaries of performance and developer experience across our dashboard and edge tooling.

What you will do
- Design and ship polished, accessible interfaces with React, TypeScript, and Next.js
- Own performance work end to end: Core Web Vitals, bundle size, and rendering latency
- Extend our design system and component library with reusable, well-tested primitives
- Integrate REST and GraphQL APIs, streaming data, and real-time collaboration features
- Write unit and end-to-end tests with Jest, Playwright, and Testing Library
- Mentor engineers through code reviews, pairing, and RFC-driven design discussions

What we look for
- 5+ years building production frontend applications with React and modern JavaScript
- Deep CSS fundamentals and experience with Tailwind CSS and responsive design
- Fluency in TypeScript, state management, caching, and data fetching patterns
- A track record of improving accessibility (WCAG), SEO, and cross-browser support
- Comfort working in a fast-moving, iterative product environment
- Bonus: experience with edge computing, CI/CD pipelines, or developer tooling`,
  },
  {
    label: "Product Manager @ Linear",
    text: `Product Manager, Core Product — Linear (Hybrid, full-time)

About the role
Linear helps thousands of software teams plan, track, and ship products with speed and clarity. As a Product Manager on the core product team, you will own the issues experience end to end — from problem discovery to launch and iteration.

What you will do
- Own the roadmap for your area, grounded in customer conversations and product metrics
- Partner with design and engineering to scope, ship, and iterate at a high cadence
- Run experiments and A/B tests to validate hypotheses before and after launch
- Write crisp specs and decision docs that keep the team aligned on strategy
- Work with analytics and SQL to understand funnels, retention, and activation
- Collect user research and synthesize it into a prioritized, opinionated backlog

What we look for
- 3+ years of product management experience for a high-growth software product
- Strong analytical skills: metrics, dashboards, and comfort with SQL
- Excellent written communication and stakeholder management across teams
- A bias toward simplicity, craft, and shipping small, opinionated increments
- Experience with Agile planning tools and OKR-driven goal setting
- Bonus: you have built developer tools or workflow software before`,
  },
  {
    label: "Data Scientist @ Anthropic",
    text: `Data Scientist, Applied AI — Anthropic (San Francisco, full-time)

About the role
Anthropic builds reliable, interpretable, and steerable AI systems. As a Data Scientist on the applied team, you will turn messy product and research data into decisions that shape how our models are trained, evaluated, and deployed.

What you will do
- Design and analyze experiments and A/B tests that guide model and product decisions
- Build data pipelines with Python, SQL, and Airflow to keep metrics trustworthy
- Develop statistical models and machine learning approaches for evaluation at scale
- Partner with researchers to design benchmarks and interpret model behavior
- Create dashboards and visualizations in Tableau or dbt that leaders rely on daily
- Communicate findings clearly to technical and non-technical stakeholders

What we look for
- 4+ years in data science, applied statistics, or machine learning roles
- Expert-level Python and SQL; fluency with Pandas, scikit-learn, or PyTorch
- Strong statistics foundations: hypothesis testing, causal inference, modeling
- Experience owning data pipelines end to end, from ingestion to visualization
- Excellent communication: you can explain nuanced results to any audience
- Bonus: experience with cloud platforms, Spark, or large-scale evaluation of LLMs`,
  },
];
