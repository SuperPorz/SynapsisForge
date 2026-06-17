/* eslint-disable */
import { DataSource } from 'typeorm';
import { Course } from '../../common/entities/courses.entity';
import { Category } from '../../common/entities/categories.entity';
import { InstructorProfile } from '../../common/entities/instructor-profile.entity';
import { Status } from '../../common/entities/enum/courses.enum';
import { SeededCategory } from './categories.seed';

export interface CourseDefinition {
  title: string;
  slug: string;
  description: string;
  price: number;
  status: Status;
  thumbnail_url: string;
  featured: boolean;
  categorySlug: string;
  instructorIndex: number; // 0=James, 1=Sofia, 2=Marco (only verified instructors)
}

// prettier-ignore
const COURSE_DEFINITIONS: CourseDefinition[] = [
  // ── Web Development (8 published) ─────────────────────────────────────────
  { title: 'React & TypeScript from Scratch', slug: 'react-typescript-from-scratch', description: 'Build modern, type-safe frontend apps with React 18 and TypeScript. Covers hooks, context, generics, and real-world patterns.', price: 0, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/react-ts/400/300', featured: true,  categorySlug: 'web-development',     instructorIndex: 1 },
  { title: 'NestJS: Build Production APIs', slug: 'nestjs-production-apis', description: 'Design and build scalable REST APIs with NestJS, TypeORM, and PostgreSQL. Includes auth, guards, interceptors, and testing.', price: 49.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/nestjs/400/300', featured: true,  categorySlug: 'web-development',     instructorIndex: 0 },
  { title: 'Angular 17: Signals & Standalone', slug: 'angular-signals-standalone', description: 'Master the new Angular with signals, standalone components, and the latest control flow syntax. Portfolio-ready projects included.', price: 39.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/angular/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 2 },
  { title: 'Full Stack with Next.js 14', slug: 'fullstack-nextjs-14', description: 'Server components, app router, server actions, and database integration with Prisma. Deploy to Vercel in minutes.', price: 54.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/nextjs/400/300', featured: true,  categorySlug: 'web-development',     instructorIndex: 1 },
  { title: 'Vue 3 Composition API', slug: 'vue3-composition-api', description: 'Learn Vue 3 from the ground up: Composition API, Pinia, Vue Router, and TypeScript integration.', price: 34.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/vue3/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 0 },
  { title: 'CSS Mastery: Modern Layouts', slug: 'css-mastery-modern-layouts', description: 'Deep dive into Flexbox, CSS Grid, animations, custom properties, and container queries. Stop fighting CSS.', price: 29.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/css/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 2 },
  { title: 'GraphQL API Design', slug: 'graphql-api-design', description: 'Design and implement GraphQL APIs with Apollo Server, resolvers, subscriptions, and authentication patterns.', price: 44.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/graphql/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 1 },
  { title: 'Testing JavaScript Apps', slug: 'testing-javascript-apps', description: 'Unit, integration, and end-to-end testing with Jest, Testing Library, and Playwright. TDD workflows included.', price: 39.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/testing/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 0 },

  // ── Data Science (6 published) ────────────────────────────────────────────
  { title: 'Python for Data Science', slug: 'python-for-data-science', description: 'From zero to data analyst: NumPy, Pandas, Matplotlib, and real-world datasets. No prior experience required.', price: 59.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/python-ds/400/300', featured: true,  categorySlug: 'data-science',        instructorIndex: 2 },
  { title: 'Machine Learning with scikit-learn', slug: 'machine-learning-sklearn', description: 'Supervised and unsupervised learning, model evaluation, feature engineering, and deployment pipelines.', price: 64.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/sklearn/400/300', featured: true,  categorySlug: 'data-science',        instructorIndex: 0 },
  { title: 'Deep Learning with PyTorch', slug: 'deep-learning-pytorch', description: 'Neural networks, CNNs, RNNs, and Transformers. Hands-on projects with real datasets from Kaggle.', price: 74.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/pytorch/400/300', featured: false, categorySlug: 'data-science',        instructorIndex: 2 },
  { title: 'SQL for Data Analysis', slug: 'sql-for-data-analysis', description: 'Master SQL for analytics: window functions, CTEs, query optimization, and business intelligence reporting.', price: 34.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/sql/400/300', featured: false, categorySlug: 'data-science',        instructorIndex: 1 },
  { title: 'Data Visualization with D3.js', slug: 'data-visualization-d3', description: 'Build interactive, publication-quality charts and dashboards directly in the browser with D3.js.', price: 44.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/d3js/400/300', featured: false, categorySlug: 'data-science',        instructorIndex: 0 },
  { title: 'Statistics for Machine Learning', slug: 'statistics-for-ml', description: 'Probability theory, hypothesis testing, Bayesian inference, and the math behind ML algorithms explained clearly.', price: 49.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/stats/400/300', featured: false, categorySlug: 'data-science',        instructorIndex: 2 },

  // ── UI/UX Design (4 published) ────────────────────────────────────────────
  { title: 'Figma for UI Designers', slug: 'figma-for-ui-designers', description: 'Components, auto-layout, variables, prototyping, and handoff workflows in Figma. Build a complete design system.', price: 39.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/figma/400/300', featured: true,  categorySlug: 'ui-ux-design',        instructorIndex: 1 },
  { title: 'UX Research & Usability Testing', slug: 'ux-research-usability', description: 'User interviews, card sorting, A/B testing, and how to turn research insights into actionable design decisions.', price: 34.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/uxresearch/400/300', featured: false, categorySlug: 'ui-ux-design',        instructorIndex: 1 },
  { title: 'Design Systems from Scratch', slug: 'design-systems-from-scratch', description: 'Build scalable design systems with tokens, components, documentation, and integration with React.', price: 49.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/designsys/400/300', featured: false, categorySlug: 'ui-ux-design',        instructorIndex: 0 },
  { title: 'Motion Design with Framer', slug: 'motion-design-framer', description: 'Microinteractions, page transitions, and scroll-based animations with Framer Motion. Make your UI feel alive.', price: 29.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/framer/400/300', featured: false, categorySlug: 'ui-ux-design',        instructorIndex: 2 },

  // ── Mobile Development (4 published) ─────────────────────────────────────
  { title: 'Flutter: Cross-Platform Apps', slug: 'flutter-cross-platform', description: 'Build beautiful iOS and Android apps from a single codebase. State management with Riverpod and REST API integration.', price: 49.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/flutter/400/300', featured: true,  categorySlug: 'mobile-development',  instructorIndex: 2 },
  { title: 'React Native Fundamentals', slug: 'react-native-fundamentals', description: 'Build and ship mobile apps with React Native and Expo. Navigation, device APIs, and app store deployment.', price: 44.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/rn/400/300', featured: false, categorySlug: 'mobile-development',  instructorIndex: 0 },
  { title: 'Swift & SwiftUI for Beginners', slug: 'swift-swiftui-beginners', description: 'Apple ecosystem development from scratch: Swift syntax, SwiftUI views, data flow, and publishing to the App Store.', price: 54.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/swift/400/300', featured: false, categorySlug: 'mobile-development',  instructorIndex: 1 },
  { title: 'Kotlin for Android Development', slug: 'kotlin-android', description: 'Modern Android development with Kotlin, Jetpack Compose, Room, and the MVVM architecture pattern.', price: 49.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/kotlin/400/300', featured: false, categorySlug: 'mobile-development',  instructorIndex: 2 },

  // ── DevOps (4 published) ──────────────────────────────────────────────────
  { title: 'Docker & Kubernetes in Production', slug: 'docker-kubernetes-production', description: 'Containerize applications, manage clusters, set up autoscaling, and deploy to AWS EKS. Real-world DevOps workflows.', price: 59.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/k8s/400/300', featured: true,  categorySlug: 'devops',              instructorIndex: 0 },
  { title: 'CI/CD with GitHub Actions', slug: 'cicd-github-actions', description: 'Automate testing, building, and deployment pipelines. Covers secrets management, matrix builds, and custom actions.', price: 39.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/ghactions/400/300', featured: false, categorySlug: 'devops',              instructorIndex: 2 },
  { title: 'Infrastructure as Code with Terraform', slug: 'iac-terraform', description: 'Provision AWS infrastructure with Terraform: modules, state management, workspaces, and team workflows.', price: 54.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/terraform/400/300', featured: false, categorySlug: 'devops',              instructorIndex: 0 },
  { title: 'Linux Administration Fundamentals', slug: 'linux-admin-fundamentals', description: 'Shell scripting, process management, networking, permissions, and server hardening. Essential for every developer.', price: 34.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/linux/400/300', featured: false, categorySlug: 'devops',              instructorIndex: 1 },

  // ── Cybersecurity (4 published) ───────────────────────────────────────────
  { title: 'Ethical Hacking & Penetration Testing', slug: 'ethical-hacking-pentest', description: 'Reconnaissance, exploitation, post-exploitation, and reporting. Hands-on labs in a safe virtual environment.', price: 69.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/pentest/400/300', featured: true,  categorySlug: 'cybersecurity',       instructorIndex: 2 },
  { title: 'Web Application Security (OWASP)', slug: 'web-app-security-owasp', description: 'SQL injection, XSS, CSRF, broken auth, and the full OWASP Top 10. Learn to think like an attacker.', price: 59.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/owasp/400/300', featured: false, categorySlug: 'cybersecurity',       instructorIndex: 0 },
  { title: 'Network Security & Protocols', slug: 'network-security-protocols', description: 'TCP/IP deep dive, firewall configuration, VPNs, IDS/IPS systems, and traffic analysis with Wireshark.', price: 54.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/netsec/400/300', featured: false, categorySlug: 'cybersecurity',       instructorIndex: 1 },
  { title: 'Cryptography for Developers', slug: 'cryptography-for-developers', description: 'Symmetric and asymmetric encryption, hashing, digital signatures, TLS, and how to use crypto correctly in code.', price: 44.99, status: Status.PUBLISHED, thumbnail_url: 'https://picsum.photos/seed/crypto/400/300', featured: false, categorySlug: 'cybersecurity',       instructorIndex: 2 },

  // ── PENDING (awaiting admin approval) ─────────────────────────────────────
  { title: 'Rust Programming Language', slug: 'rust-programming-language', description: 'Systems programming with Rust: ownership, lifetimes, traits, async, and building CLI tools and web servers.', price: 54.99, status: Status.PENDING, thumbnail_url: 'https://picsum.photos/seed/rust/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 0 },
  { title: 'Blockchain Development with Solidity', slug: 'blockchain-solidity', description: 'Smart contracts, EVM, DeFi protocols, and deploying to Ethereum testnets. Web3 development from scratch.', price: 79.99, status: Status.PENDING, thumbnail_url: 'https://picsum.photos/seed/solidity/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 1 },
  { title: 'AI-Assisted Data Analysis', slug: 'ai-assisted-data-analysis', description: 'Leverage LLMs and AI tools to supercharge your data analysis workflows in Python. Includes prompt engineering for data tasks.', price: 64.99, status: Status.PENDING, thumbnail_url: 'https://picsum.photos/seed/ai-data/400/300', featured: false, categorySlug: 'data-science',        instructorIndex: 2 },

  // ── DRAFT (work in progress) ──────────────────────────────────────────────
  { title: 'Go for Backend Developers', slug: 'go-for-backend-developers', description: 'Build high-performance HTTP services with Go: goroutines, channels, standard library, and deployment strategies.', price: 49.99, status: Status.DRAFT, thumbnail_url: 'https://picsum.photos/seed/golang/400/300', featured: false, categorySlug: 'web-development',     instructorIndex: 0 },
  { title: 'iOS Development with UIKit', slug: 'ios-development-uikit', description: 'Classic UIKit patterns, Auto Layout, navigation, Core Data, and networking. Ideal for developers targeting legacy iOS apps.', price: 59.99, status: Status.DRAFT, thumbnail_url: 'https://picsum.photos/seed/uikit/400/300', featured: false, categorySlug: 'mobile-development',  instructorIndex: 1 },
];

export async function seedCourses(
  ds: DataSource,
  categories: SeededCategory[],
  instructorProfiles: InstructorProfile[],
): Promise<Course[]> {
  const repo = ds.getRepository(Course);

  // Only verified instructors (indices 0, 1, 2) get courses
  const verifiedInstructors = instructorProfiles.slice(0, 3);

  const entities = COURSE_DEFINITIONS.map((def) => {
    const category = categories.find((c) => c.slug === def.categorySlug);
    const instructor = verifiedInstructors[def.instructorIndex];

    if (!category) throw new Error(`Category not found: ${def.categorySlug}`);
    if (!instructor) throw new Error(`Instructor not found at index ${def.instructorIndex}`);

    return repo.create({
      title: def.title,
      slug: def.slug,
      description: def.description,
      price: def.price,
      status: def.status,
      thumbnail_url: def.thumbnail_url,
      featured: def.featured,
      instructor,
      category: { id: category.id } as Category,
    });
  });

  const saved = await repo.save(entities);

  const published = saved.filter((c) => c.status === Status.PUBLISHED).length;
  const pending = saved.filter((c) => c.status === Status.PENDING).length;
  const draft = saved.filter((c) => c.status === Status.DRAFT).length;

  console.log(`  ✅ ${saved.length} courses (${published} published, ${pending} pending, ${draft} draft)`);
  return saved;
}
