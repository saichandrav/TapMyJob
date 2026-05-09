const platformUrls = {
  linkedin: 'https://www.linkedin.com/jobs/view',
  naukri: 'https://www.naukri.com/job-listings',
  indeed: 'https://in.indeed.com/viewjob',
  google: 'https://careers.google.com/jobs/results',
  microsoft: 'https://jobs.careers.microsoft.com/global/en/job',
  tcs: 'https://www.tcs.com/careers/job-details',
}

const buildJobs = (platformId, rows) =>
  rows.map((row, index) => {
    const [title, company, location, experience, salary, category, skills, stage] = row

    return {
      id: `${platformId}-${String(index + 1).padStart(2, '0')}`,
      platformId,
      title,
      company,
      location,
      experience,
      salary,
      category,
      skills,
      stage,
      postedMinutesAgo: 18 + index * 11,
      remote: location === 'Remote',
      type: 'Full-time',
      matchScore: Math.max(72, 96 - index * 2),
      description: `${company} is hiring a ${title.toLowerCase()} to build resilient ${category.toLowerCase()} systems for teams in ${location}.`,
      sourceUrl: `${platformUrls[platformId]}/${String(index + 1)}`,
    }
  })

const linkedinJobs = [
  ['Senior React Engineer', 'Flipkart', 'Bangalore', '5-8 years', '₹28L - ₹40L', 'Frontend', ['React', 'TypeScript', 'GraphQL'], 'applied'],
  ['Node.js Backend Engineer', 'Razorpay', 'Remote', '4-7 years', '₹30L - ₹45L', 'Backend', ['Node.js', 'Postgres', 'Kafka'], 'saved'],
  ['Python Data Engineer', 'Meesho', 'Bangalore', '3-6 years', '₹22L - ₹32L', 'Data Engineering', ['Python', 'Airflow', 'Spark'], 'interview'],
  ['DevOps SRE', 'Swiggy', 'Hyderabad', '5-9 years', '₹26L - ₹38L', 'DevOps', ['Kubernetes', 'Terraform', 'AWS'], 'new'],
  ['ML Engineer', 'CRED', 'Remote', '4-8 years', '₹32L - ₹50L', 'Machine Learning', ['Python', 'LLMs', 'MLOps'], 'offer'],
  ['Full Stack Engineer', 'Zerodha', 'Bangalore', '3-6 years', '₹24L - ₹36L', 'Full Stack', ['React', 'Node.js', 'Redis'], 'applied'],
  ['React UI Engineer', 'PhonePe', 'Bangalore', '2-5 years', '₹18L - ₹28L', 'Frontend', ['React', 'Design Systems', 'CSS'], 'saved'],
  ['Staff Node Engineer', 'Udaan', 'Delhi', '6-10 years', '₹34L - ₹48L', 'Backend', ['Node.js', 'MySQL', 'Microservices'], 'interview'],
  ['Data Scientist', 'Haptik', 'Mumbai', '3-6 years', '₹20L - ₹30L', 'Data Science', ['Python', 'Pandas', 'Experimentation'], 'new'],
  ['Platform Engineer', 'BrowserStack', 'Remote', '4-7 years', '₹28L - ₹42L', 'DevOps', ['AWS', 'Kubernetes', 'Observability'], 'applied'],
  ['Python Automation Engineer', 'Freshworks', 'Bangalore', '3-5 years', '₹18L - ₹29L', 'Automation', ['Python', 'Selenium', 'CI/CD'], 'saved'],
  ['React Native Engineer', 'Groww', 'Bangalore', '3-5 years', '₹20L - ₹30L', 'Mobile', ['React Native', 'TypeScript', 'Redux'], 'new'],
  ['Backend Engineer', 'Ola', 'Bangalore', '4-7 years', '₹24L - ₹35L', 'Backend', ['Go', 'Node.js', 'RabbitMQ'], 'interview'],
  ['Senior Data Scientist', 'Dream11', 'Mumbai', '5-9 years', '₹30L - ₹45L', 'Data Science', ['Python', 'ML', 'PyTorch'], 'offer'],
  ['ML Platform Engineer', 'Atlassian', 'Remote', '4-8 years', '₹34L - ₹52L', 'Machine Learning', ['Python', 'LLMOps', 'Kubernetes'], 'applied'],
]

const naukriJobs = [
  ['Node.js Engineer', 'TCS iON', 'Hyderabad', '3-6 years', '₹16L - ₹24L', 'Backend', ['Node.js', 'Express', 'MongoDB'], 'saved'],
  ['React Developer', 'Infosys', 'Bangalore', '2-5 years', '₹14L - ₹22L', 'Frontend', ['React', 'Redux', 'JavaScript'], 'new'],
  ['Python Engineer', 'Wipro', 'Remote', '3-7 years', '₹15L - ₹26L', 'Backend', ['Python', 'Django', 'APIs'], 'applied'],
  ['DevOps Engineer', 'HCLTech', 'Delhi', '4-8 years', '₹18L - ₹30L', 'DevOps', ['AWS', 'Docker', 'Terraform'], 'interview'],
  ['Data Scientist', 'Tech Mahindra', 'Mumbai', '3-6 years', '₹19L - ₹28L', 'Data Science', ['Python', 'SQL', 'ML'], 'saved'],
  ['Full Stack Developer', 'LTIMindtree', 'Bangalore', '3-6 years', '₹18L - ₹27L', 'Full Stack', ['React', 'Node.js', 'Postgres'], 'new'],
  ['ML Engineer', 'Mindtree', 'Hyderabad', '4-8 years', '₹22L - ₹34L', 'Machine Learning', ['Python', 'PyTorch', 'MLOps'], 'applied'],
  ['Backend Developer', 'Cognizant', 'Mumbai', '2-5 years', '₹13L - ₹20L', 'Backend', ['Java', 'Spring Boot', 'SQL'], 'new'],
  ['Frontend Developer', 'Capgemini', 'Remote', '2-4 years', '₹12L - ₹18L', 'Frontend', ['React', 'HTML', 'CSS'], 'saved'],
  ['Cloud Engineer', 'Tata Elxsi', 'Bangalore', '4-7 years', '₹20L - ₹30L', 'Cloud', ['Azure', 'Kubernetes', 'CI/CD'], 'interview'],
  ['Python Analyst', 'Zoho', 'Bangalore', '2-5 years', '₹14L - ₹21L', 'Data', ['Python', 'Excel', 'SQL'], 'offer'],
  ['Data Platform Engineer', 'IBM India', 'Remote', '4-7 years', '₹20L - ₹31L', 'Data Engineering', ['Spark', 'Python', 'Databricks'], 'new'],
]

const indeedJobs = [
  ['React Engineer', 'PhonePe', 'Bangalore', '3-6 years', '₹22L - ₹33L', 'Frontend', ['React', 'TypeScript', 'Accessibility'], 'saved'],
  ['Node Backend Engineer', 'Pine Labs', 'Remote', '4-7 years', '₹24L - ₹36L', 'Backend', ['Node.js', 'Kafka', 'Postgres'], 'applied'],
  ['Data Engineer', 'Sprinklr', 'Delhi', '3-6 years', '₹19L - ₹29L', 'Data Engineering', ['Python', 'Airflow', 'Snowflake'], 'interview'],
  ['DevOps Engineer', 'Delhivery', 'Delhi', '4-8 years', '₹18L - ₹28L', 'DevOps', ['AWS', 'Docker', 'Linux'], 'new'],
  ['ML Engineer', 'Fractal Analytics', 'Mumbai', '4-8 years', '₹26L - ₹40L', 'Machine Learning', ['Python', 'PyTorch', 'NLP'], 'offer'],
  ['Full Stack Engineer', 'Swiggy', 'Bangalore', '3-6 years', '₹24L - ₹35L', 'Full Stack', ['React', 'Node.js', 'GraphQL'], 'saved'],
  ['Python Developer', 'Dream11', 'Mumbai', '2-5 years', '₹18L - ₹27L', 'Backend', ['Python', 'FastAPI', 'Postgres'], 'applied'],
  ['SRE Engineer', 'Chargebee', 'Remote', '4-7 years', '₹25L - ₹37L', 'DevOps', ['Kubernetes', 'Observability', 'AWS'], 'new'],
  ['Frontend Engineer', 'Razorpay', 'Bangalore', '3-5 years', '₹22L - ₹34L', 'Frontend', ['React', 'Tailwind', 'Testing'], 'interview'],
  ['Data Scientist', 'Flipkart', 'Bangalore', '3-7 years', '₹24L - ₹35L', 'Data Science', ['Python', 'ML', 'Experimentation'], 'saved'],
]

const googleJobs = [
  ['Software Engineer, Frontend', 'Google', 'Bangalore', '4-8 years', '₹45L - ₹72L', 'Frontend', ['React', 'TypeScript', 'Performance'], 'interview'],
  ['Backend SWE', 'Google', 'Hyderabad', '4-8 years', '₹48L - ₹76L', 'Backend', ['Go', 'Distributed Systems', 'GCP'], 'applied'],
  ['Data Scientist', 'Google', 'Bangalore', '3-7 years', '₹46L - ₹74L', 'Data Science', ['Python', 'Stats', 'Experimentation'], 'saved'],
  ['ML Engineer', 'Google', 'Remote', '4-8 years', '₹52L - ₹80L', 'Machine Learning', ['TensorFlow', 'LLMs', 'MLOps'], 'offer'],
  ['DevOps Engineer', 'Google', 'Delhi', '5-9 years', '₹47L - ₹78L', 'DevOps', ['Kubernetes', 'GCP', 'SRE'], 'new'],
]

const microsoftJobs = [
  ['Software Engineer II', 'Microsoft', 'Hyderabad', '3-6 years', '₹40L - ₹62L', 'Backend', ['C#', '.NET', 'Azure'], 'applied'],
  ['Data Scientist', 'Microsoft', 'Bangalore', '4-7 years', '₹42L - ₹66L', 'Data Science', ['Python', 'ML', 'Azure ML'], 'saved'],
  ['Cloud DevOps Engineer', 'Microsoft', 'Remote', '4-8 years', '₹44L - ₹68L', 'DevOps', ['Azure', 'Kubernetes', 'IaC'], 'interview'],
  ['ML Engineer', 'Microsoft', 'Hyderabad', '4-8 years', '₹46L - ₹70L', 'Machine Learning', ['Python', 'PyTorch', 'MLOps'], 'new'],
]

const tcsJobs = [
  ['React Developer', 'TCS', 'Bangalore', '2-5 years', '₹11L - ₹17L', 'Frontend', ['React', 'JavaScript', 'Testing'], 'saved'],
  ['Python Developer', 'TCS', 'Hyderabad', '3-6 years', '₹12L - ₹18L', 'Backend', ['Python', 'Django', 'SQL'], 'applied'],
  ['DevOps Engineer', 'TCS', 'Mumbai', '4-7 years', '₹14L - ₹21L', 'DevOps', ['AWS', 'Docker', 'CI/CD'], 'interview'],
  ['Data Analyst', 'TCS', 'Delhi', '2-4 years', '₹10L - ₹15L', 'Data', ['SQL', 'Power BI', 'Excel'], 'new'],
]

export const jobs = [
  ...buildJobs('linkedin', linkedinJobs),
  ...buildJobs('naukri', naukriJobs),
  ...buildJobs('indeed', indeedJobs),
  ...buildJobs('google', googleJobs),
  ...buildJobs('microsoft', microsoftJobs),
  ...buildJobs('tcs', tcsJobs),
]

export const jobStages = ['new', 'saved', 'applied', 'interview', 'offer']
export const locations = ['Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Remote']
export const experienceLevels = ['2-4 years', '3-5 years', '3-6 years', '4-7 years', '5-8 years', '6-10 years']
