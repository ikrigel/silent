import React from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Stack,
  Button, Chip, Divider,
} from '@mui/material';
import { GitHub, LinkedIn, OpenInNew, Work, Code } from '@mui/icons-material';

// ─── Skill chip groups ────────────────────────────────────────────────────────

const SKILLS_PRIMARY = ['React', 'TypeScript', 'Node.js', 'Claude API', 'Gemini API', 'N8N', 'PostgreSQL', 'Vercel'];
const SKILLS_OSS = ['JavaScript', 'TypeScript', 'Python', 'Git', 'GitHub'];

// ─── Experience entries ───────────────────────────────────────────────────────

const EXPERIENCE = [
  {
    icon: <Work />,
    title: 'Full-Stack Developer & AI Integration Specialist',
    org: 'Independent Developer / Freelance',
    period: '2021 – Present',
    bullets: [
      'Developed 50+ production applications and tools using React, Node.js, and TypeScript',
      'Integrated AI/ML models including Claude API, Gemini, and OpenAI into applications',
      'Built automation workflows using N8N and GitHub Actions for enterprise clients',
      'Implemented real-time features using WebSockets and modern React patterns',
      'Deployed applications on Vercel, Render, and GCP with CI/CD pipelines',
    ],
    skills: SKILLS_PRIMARY,
  },
  {
    icon: <Code />,
    title: 'Open Source Developer',
    org: 'Open Source Contributions',
    period: '2020 – Present',
    bullets: [
      'Contributed to multiple open-source projects with focus on developer tools and utilities',
      'Maintained repositories with comprehensive documentation and CI/CD pipelines',
      'Collaborated with community members on bug fixes and feature implementations',
      'Created educational content and tutorials for developers',
    ],
    skills: SKILLS_OSS,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/** About page — developer bio, experience, skills, and project info */
const AboutPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>About</Typography>

      {/* ── Developer Hero Card ─────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Avatar
              sx={{ width: 110, height: 110, fontSize: '2.5rem', bgcolor: 'primary.main', flexShrink: 0 }}
            >
              IK
            </Avatar>

            <Box flex={1}>
              <Typography variant="h5" fontWeight="bold">Ilan Kri-Gel</Typography>
              <Typography variant="subtitle1" color="primary" fontWeight="medium" gutterBottom>
                Full-Stack Developer &amp; AI Integration Specialist
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                📍 Ramat Zvi, Israel · EMEA
              </Typography>

              <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                With over 4 years of experience, I've built 50+ projects ranging from web
                applications to automation systems and AI-powered tools. My expertise spans
                modern React applications, TypeScript, Node.js backend development, and
                cutting-edge AI/ML integrations. I specialize in building intelligent systems
                that solve real-world problems using APIs like Claude, Gemini, and OpenAI.
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                Passionate about writing clean, maintainable code and staying at the forefront
                of web development. Always learning, always building.
              </Typography>

              {/* Social links */}
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<GitHub />}
                  href="https://github.com/ikrigel?tab=repositories"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LinkedIn />}
                  href="https://www.linkedin.com/in/ikrigel/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNew />}
                  href="https://portfolio-dusky-eight-77.vercel.app/#/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Portfolio
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Experience Timeline ─────────────────────────────────────────────── */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>Experience</Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {EXPERIENCE.map((exp) => (
          <Card key={exp.title}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    p: 0.75,
                    display: 'flex',
                    flexShrink: 0,
                    mt: 0.5,
                  }}
                >
                  {exp.icon}
                </Box>
                <Box flex={1}>
                  <Typography fontWeight="bold">{exp.title}</Typography>
                  <Typography variant="body2" color="primary">{exp.org}</Typography>
                  <Typography variant="caption" color="text.secondary">{exp.period}</Typography>

                  <Box component="ul" sx={{ pl: 2, mt: 1, mb: 1 }}>
                    {exp.bullets.map((b) => (
                      <Typography key={b} component="li" variant="body2" sx={{ mb: 0.5 }}>
                        {b}
                      </Typography>
                    ))}
                  </Box>

                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                    {exp.skills.map((s) => (
                      <Chip key={s} label={s} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* ── About Silent ────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>💤 About Silent</Typography>
          <Typography variant="body2" paragraph>
            Silent is an open-source emergency alert scheduler that helps you manage when
            your device silences government emergency notifications. Schedule silencing periods
            by time of day, day of week, or custom date ranges.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {['React', 'TypeScript', 'MUI', 'Vite', 'Zustand'].map((tech) => (
              <Chip key={tech} label={tech} size="small" variant="outlined" />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="warning.main">⚠️ Important Disclaimer</Typography>
          <Typography variant="body2">
            Emergency alerts exist to save lives. Silencing them means you may not receive
            critical safety information in real time. Use this tool responsibly and be aware
            of your local emergency notification regulations.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AboutPage;
