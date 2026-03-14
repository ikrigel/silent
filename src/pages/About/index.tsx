import React from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Stack,
  Button, Chip, Divider,
} from '@mui/material';
import { GitHub, LinkedIn, OpenInNew, Work, Code } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const SKILLS_PRIMARY = ['React', 'TypeScript', 'Node.js', 'Claude API', 'Gemini API', 'N8N', 'PostgreSQL', 'Vercel'];
const SKILLS_OSS = ['JavaScript', 'TypeScript', 'Python', 'Git', 'GitHub'];

/** About page — developer bio, experience, skills, and project info */
const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const EXPERIENCE = [
    {
      icon: <Work />,
      title: t('about.exp1Title'),
      org: t('about.exp1Org'),
      period: t('about.exp1Period'),
      bullets: [t('about.exp1b1'), t('about.exp1b2'), t('about.exp1b3'), t('about.exp1b4'), t('about.exp1b5')],
      skills: SKILLS_PRIMARY,
    },
    {
      icon: <Code />,
      title: t('about.exp2Title'),
      org: t('about.exp2Org'),
      period: t('about.exp2Period'),
      bullets: [t('about.exp2b1'), t('about.exp2b2'), t('about.exp2b3'), t('about.exp2b4')],
      skills: SKILLS_OSS,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{t('about.title')}</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Avatar sx={{ width: 110, height: 110, fontSize: '2.5rem', bgcolor: 'primary.main', flexShrink: 0 }}>
              IK
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight="bold">Igal Krigel</Typography>
              <Typography variant="subtitle1" color="primary" fontWeight="medium" gutterBottom>
                {t('about.role')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {t('about.location')}
              </Typography>
              <Typography variant="body2" paragraph sx={{ mt: 1 }}>{t('about.bio1')}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>{t('about.bio2')}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Button variant="contained" size="small" startIcon={<GitHub />}
                  href="https://github.com/ikrigel?tab=repositories" target="_blank" rel="noopener noreferrer">
                  GitHub
                </Button>
                <Button variant="outlined" size="small" startIcon={<LinkedIn />}
                  href="https://www.linkedin.com/in/ikrigel/" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </Button>
                <Button variant="outlined" size="small" startIcon={<OpenInNew />}
                  href="https://portfolio-dusky-eight-77.vercel.app/#/" target="_blank" rel="noopener noreferrer">
                  Portfolio
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight="bold" gutterBottom>{t('about.experience')}</Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {EXPERIENCE.map((exp) => (
          <Card key={exp.title}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, p: 0.75, display: 'flex', flexShrink: 0, mt: 0.5 }}>
                  {exp.icon}
                </Box>
                <Box flex={1}>
                  <Typography fontWeight="bold">{exp.title}</Typography>
                  <Typography variant="body2" color="primary">{exp.org}</Typography>
                  <Typography variant="caption" color="text.secondary">{exp.period}</Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 1, mb: 1 }}>
                    {exp.bullets.map((b, i) => (
                      <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>{b}</Typography>
                    ))}
                  </Box>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                    {exp.skills.map((s) => <Chip key={s} label={s} size="small" variant="outlined" />)}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t('about.appTitle')}</Typography>
          <Typography variant="body2" paragraph>{t('about.appDesc')}</Typography>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {['React', 'TypeScript', 'MUI', 'Vite', 'Zustand'].map((tech) => (
              <Chip key={tech} label={tech} size="small" variant="outlined" />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="warning.main">{t('about.disclaimer')}</Typography>
          <Typography variant="body2">{t('about.disclaimerText')}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AboutPage;
