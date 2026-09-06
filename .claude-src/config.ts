import type { Domain, ProjectConfig, AgentScopeConfig, SkillConfig } from './config-types'

const skills: SkillConfig[] = [
  // global
  { id: 'web-framework-react', scope: 'global', origin: 'agents-inc' },
  { id: 'web-meta-framework-nextjs', scope: 'global', origin: 'agents-inc' },
  { id: 'web-styling-cva', scope: 'global', origin: 'agents-inc' },
  { id: 'web-styling-design-tokens', scope: 'global', origin: 'agents-inc' },
  { id: 'web-styling-tailwind', scope: 'global', origin: 'agents-inc' },
  { id: 'web-forms-zod-validation', scope: 'global', origin: 'agents-inc' },
  { id: 'web-forms-react-hook-form', scope: 'global', origin: 'agents-inc' },
  { id: 'web-testing-react-testing-library', scope: 'global', origin: 'agents-inc' },
  { id: 'web-testing-vitest', scope: 'global', origin: 'agents-inc' },
  { id: 'web-testing-playwright-e2e', scope: 'global', origin: 'agents-inc' },
  { id: 'web-ui-shadcn-ui', scope: 'global', origin: 'agents-inc' },
  { id: 'web-ui-radix-ui', scope: 'global', origin: 'agents-inc' },
  { id: 'web-ui-tanstack-table', scope: 'global', origin: 'agents-inc' },
  { id: 'web-mocks-msw', scope: 'global', origin: 'agents-inc' },
  { id: 'web-error-handling-error-boundaries', scope: 'global', origin: 'agents-inc' },
  { id: 'web-error-handling-result-types', scope: 'global', origin: 'agents-inc' },
  { id: 'web-files-file-upload-patterns', scope: 'global', origin: 'agents-inc' },
  { id: 'web-files-image-handling', scope: 'global', origin: 'agents-inc' },
  { id: 'web-utilities-date-fns', scope: 'global', origin: 'agents-inc' },
  { id: 'web-accessibility-web-accessibility', scope: 'global', origin: 'agents-inc' },
  { id: 'web-performance-web-performance', scope: 'global', origin: 'agents-inc' },
  { id: 'web-dataviz-recharts', scope: 'global', origin: 'agents-inc' },
  { id: 'api-database-postgresql', scope: 'global', origin: 'agents-inc' },
  { id: 'api-baas-supabase', scope: 'global', origin: 'agents-inc' },
  { id: 'api-observability-axiom-pino-sentry', scope: 'global', origin: 'agents-inc' },
  { id: 'api-performance-api-performance', scope: 'global', origin: 'agents-inc' },
  { id: 'api-messaging-webhooks', scope: 'global', origin: 'agents-inc' },
  { id: 'infra-ci-cd-github-actions', scope: 'global', origin: 'agents-inc' },
  { id: 'infra-platform-vercel', scope: 'global', origin: 'agents-inc' },
  { id: 'infra-config-setup-env', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-reviewing-api-reviewing', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-reviewing-reviewing', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-reviewing-infra-reviewing', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-reviewing-web-reviewing', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-methodology-research-methodology', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-design-composable-components', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-design-expressive-typescript', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-planning-api-planning', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-planning-web-planning', scope: 'global', origin: 'agents-inc' },
  { id: 'shared-tooling-eslint-prettier', scope: 'global', origin: 'agents-inc' },
  { id: 'shared-tooling-git-hooks', scope: 'global', origin: 'agents-inc' },
  { id: 'meta-config-stack-detect', scope: 'global', origin: 'agents-inc' },
  { id: 'shared-tooling-typescript-config', scope: 'global', origin: 'agents-inc' },
  { id: 'shared-security-auth-security', scope: 'global', origin: 'agents-inc' },
  { id: 'vonatur-saas', scope: 'global', origin: 'eject' },
]

const agents: AgentScopeConfig[] = [
  // global
  { name: 'api-developer', scope: 'global' },
  { name: 'api-researcher', scope: 'global' },
  { name: 'api-tester', scope: 'global' },
  { name: 'pm', scope: 'global' },
  { name: 'reviewer', scope: 'global' },
  { name: 'skill-summoner', scope: 'global' },
  { name: 'web-developer', scope: 'global' },
  { name: 'web-researcher', scope: 'global' },
  { name: 'web-tester', scope: 'global' },
]

const selectedDomains: Domain[] = ['web', 'api', 'infra', 'meta', 'shared']

export default {
  name: 'vonatur',
  marketplace: 'github:agents-inc/skills',
  marketplaceName: 'agents-inc',
  skills,
  agents,
  selectedDomains,
} satisfies ProjectConfig
