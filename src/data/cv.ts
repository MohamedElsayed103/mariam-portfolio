// Single source of truth for every word on the site.
// Facts come from Mariam's CV and her public GitHub. Do not add claims that are not here.

export const person = {
  name: 'Mariam Ahmed',
  fullName: 'Mariam Ahmed Ismail Mahmoud',
  initials: 'MA',
  role: 'Backend Java Developer',
  location: 'Cairo, Egypt',
  email: 'mariem2001.ahmed@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mariam-ahmed-a5776b1ba/',
  github: 'https://github.com/MariamAhmeddd',
  githubHandle: 'MariamAhmeddd',
  cv: '/Mariam-Ahmed-CV.pdf',
  status: 'Open to backend roles',
  headline: 'I build the services behind the screen.',
  intro:
    'Backend developer working in Java and Spring Boot. Two years of microservices for telecom, data and enterprise teams at E& Egypt, Data Gear and Giza Systems.',
  // Long-form statement for the About section (scroll-scrubbed).
  statement:
    'I like the part of software nobody sees: the service that answers in time, the queue that never drops a message, the state that is always the one you expect. I write Java with Spring Boot, split systems into services that can fail on their own, and keep refactoring until the code says what it does.',
  facts: [
    { label: 'Based in', value: 'Cairo, Egypt' },
    { label: 'Focus', value: 'Java, Spring Boot, microservices' },
    { label: 'Degree', value: 'BSc Computer Science, Ain Shams University, 2020 to 2024' },
    { label: 'Graduation project', value: 'Video Content Search, grade A−' },
  ],
};

export type Role = {
  id: string;
  state: string; // state-machine style identifier
  company: string;
  title: string;
  start: string;
  end: string;
  period: string;
  transition: string; // event label on the arrow INTO this state
  points: string[];
  stack: string[];
};

// Oldest first: the order a state machine would move through them.
export const experience: Role[] = [
  {
    id: 'mcit',
    state: 'INSTRUCTOR',
    company: 'Ministry of Communications and Information Technology',
    title: 'Part-Time Instructor',
    start: '2024-07',
    end: '2024-08',
    period: 'Jul 2024 to Aug 2024',
    transition: 'GRADUATED',
    points: [
      'Taught programming fundamentals to top middle and high school students in the Ashbal Misr initiative.',
      'Mentored students through problem-solving and coding exercises.',
    ],
    stack: ['Teaching', 'Mentoring', 'Problem solving'],
  },
  {
    id: 'giza',
    state: 'INTERN',
    company: 'Giza Systems',
    title: 'Java Developer Intern',
    start: '2024-09',
    end: '2025-02',
    period: 'Sep 2024 to Feb 2025',
    transition: 'INTERNSHIP_STARTED',
    points: [
      'Built and optimized Spring Boot applications across the full lifecycle, from design to deployment.',
      'Maintained and enhanced existing software as business and user needs changed.',
      'Worked with cross-functional teams on application performance and scalability.',
    ],
    stack: ['Java', 'Spring Boot', 'Spring Cloud', 'RabbitMQ', 'PostgreSQL'],
  },
  {
    id: 'datagear',
    state: 'DEVELOPER',
    company: 'Data Gear',
    title: 'Java Developer',
    start: '2025-04',
    end: '2026-01',
    period: 'Apr 2025 to Jan 2026',
    transition: 'HIRED',
    points: [
      'Enhanced and refactored Spring Boot applications for better performance and maintainability.',
    ],
    stack: ['Java', 'Spring Boot', 'Refactoring', 'Performance'],
  },
  {
    id: 'eand',
    state: 'DEVELOPER_TELECOM',
    company: 'E& Egypt',
    title: 'Java Developer',
    start: '2026-01',
    end: '2026-10',
    period: 'Jan 2026 to Oct 2026',
    transition: 'MOVED_TO_TELECOM',
    points: [
      'Developed and enhanced Java applications built on Spring Boot.',
      'Worked with cross-functional teams to implement business requirements and support application deployments.',
    ],
    stack: ['Java', 'Spring Boot', 'Deployments'],
  },
];

// The state after the last one: where the machine is waiting now.
export const nextState = {
  state: 'OPEN_TO_OFFERS',
  transition: 'YOUR_MESSAGE',
  label: 'Next role',
  note: 'Waiting on one event.',
};

export const education = {
  degree: 'BSc Computer Science',
  school: 'Ain Shams University',
  period: '2020 to 2024',
};

export const projects = {
  telephony: {
    id: 'telephony',
    name: 'Telephony',
    year: '2025',
    kind: 'Microservices platform',
    summary:
      'A Spring Boot microservices application for registering and tracking mobile phones in Egypt.',
    features: [
      'IMEI tracking',
      'Online payment',
      'Registration for non-Egyptian residents',
      'Smuggled phone tracking',
    ],
    integrations: ['Digital Egypt', 'CyShield', 'E-Finance'],
    stack: ['Spring Boot', 'Spring Security', 'Spring Cloud', 'PostgreSQL', 'Redis', 'Elasticsearch', 'MinIO'],
    link: {
      label: 'Telephony on Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.ntra.citizen',
    },
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital Management System',
    year: '2025',
    kind: 'Microservices, team project',
    summary:
      'A Spring Boot microservices system for hospital operations: patients and doctors, appointments, medical records, notifications and role-based security.',
    context: 'Final project of the Giza Systems internship, built as a team.',
    myPart:
      'I built the workflow service, which tracks every patient through a Spring StateMachine, and the notification service that emails doctors when appointments change.',
    features: [
      'Patient and doctor management',
      'Appointment scheduling',
      'Medical records access',
      'Automated patient status updates',
      'Real-time notifications',
      'Role-based security',
    ],
    stack: ['Spring Boot', 'Spring StateMachine', 'RabbitMQ', 'PostgreSQL', 'Redis', 'Spring Security', 'Spring Cloud'],
    link: {
      label: 'Source on GitHub',
      href: 'https://github.com/MariamAhmeddd/Hospital-Management-system',
    },
    // Real architecture, read from the repository.
    services: [
      { id: 'registry', name: 'service-registry', note: 'Eureka discovery' },
      { id: 'user', name: 'user-management-service', note: 'JWT auth, roles ADMIN / DOCTOR / PATIENT, Redis OTP' },
      { id: 'appointment', name: 'appointment-service', note: 'Book, reschedule, cancel' },
      { id: 'workflow', name: 'workflow_service', note: 'Patient state machine', mine: true },
      { id: 'notification', name: 'notification_service', note: 'Email to doctors', mine: true },
    ],
    queues: [
      { name: 'statusQueue', from: ['appointment-service', 'user-management-service'], to: 'workflow_service' },
      { name: 'appointmentQueue', from: ['appointment-service'], to: 'notification_service' },
    ],
    // The actual Spring StateMachine configuration in workflow_service.
    machine: {
      initial: 'REGISTERED',
      states: ['REGISTERED', 'UNDERTREATMENT', 'DISCHARGED', 'CANCELLED'],
      final: ['DISCHARGED', 'CANCELLED'],
      events: ['TREATMENT_STARTED', 'TREATMENT_COMPLETED', 'APPOINTMENT_CANCELLED'],
      transitions: [
        { from: 'REGISTERED', to: 'UNDERTREATMENT', event: 'TREATMENT_STARTED' },
        { from: 'UNDERTREATMENT', to: 'DISCHARGED', event: 'TREATMENT_COMPLETED' },
        { from: 'REGISTERED', to: 'DISCHARGED', event: 'TREATMENT_COMPLETED' },
        { from: 'REGISTERED', to: 'CANCELLED', event: 'APPOINTMENT_CANCELLED' },
        { from: 'UNDERTREATMENT', to: 'CANCELLED', event: 'APPOINTMENT_CANCELLED' },
      ],
      notes: [
        'Events arrive as JSON on statusQueue.',
        'DISCHARGED and CANCELLED are final: later events are rejected.',
        'A nightly job cancels records left untouched for a month.',
      ],
    },
  },
  video: {
    id: 'video',
    name: 'Video Content Search',
    year: '2024',
    kind: 'Graduation project, grade A−',
    summary: 'Software that finds moments inside videos from a text query.',
    features: ['Object detection in frames', 'Audio search with timestamps'],
    stack: ['React', 'Flask', 'Faster Whisper', 'BERT'],
    // Pipeline stages for the diagram, in order.
    pipeline: [
      { id: 'query', label: 'Text query', note: 'React' },
      { id: 'api', label: 'API', note: 'Flask' },
      { id: 'audio', label: 'Speech to text', note: 'Faster Whisper' },
      { id: 'frames', label: 'Object detection', note: 'Video frames' },
      { id: 'match', label: 'Semantic match', note: 'BERT' },
      { id: 'result', label: 'Timestamps', note: 'Jump to the moment' },
    ],
  },
};

export const stack = [
  {
    id: 'languages',
    layer: 'Languages',
    lead: 'Java',
    items: ['Java', 'C++', 'Python', 'Dart', 'C#'],
  },
  {
    id: 'spring',
    layer: 'Spring',
    lead: 'Spring Boot',
    items: ['Spring Boot', 'Spring Cloud', 'Spring Security', 'Spring StateMachine', 'Spring Batch', 'Spring Integration'],
  },
  {
    id: 'messaging',
    layer: 'Messaging and cache',
    lead: 'RabbitMQ',
    items: ['RabbitMQ', 'Redis'],
  },
  {
    id: 'data',
    layer: 'Data',
    lead: 'PostgreSQL',
    items: ['PostgreSQL', 'MySQL', 'SQL', 'Elasticsearch'],
  },
  {
    id: 'apis',
    layer: 'APIs and tooling',
    lead: 'REST',
    items: ['REST APIs', 'SOAP', 'Git', 'GitHub'],
  },
  {
    id: 'foundations',
    layer: 'Foundations',
    lead: 'Design patterns',
    items: ['OOP', 'SOLID principles', 'Design patterns', 'Algorithms and data structures', 'Databases', 'Problem solving', 'HTML, CSS, JS'],
  },
];

export const community = [
  {
    id: 'ashbal',
    org: 'Ashbal Misr, Ministry of Communications and Information Technology',
    role: 'Part-Time Instructor',
    text: 'Taught programming fundamentals to top middle and high school students, and mentored them through problem-solving and coding exercises.',
  },
  {
    id: 'osc',
    org: 'Open Source Community',
    role: 'Vice Head, Science and Tech Committee',
    text: 'Organized workshops, mentored teams, delivered sessions and supported the growth of the community.',
  },
  {
    id: 'msp',
    org: 'Microsoft Student Partner',
    role: 'Flutter Team Leader',
    text: 'Organized workshops and supported students learning Flutter.',
  },
];

export const nav = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#stack', label: 'Stack' },
  { href: '#contact', label: 'Contact' },
];
