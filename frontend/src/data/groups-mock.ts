import type { Group } from '../types/evaluation'

export const groupsSeedData: Group[] = [
  {
    id: 'GRP-01',
    name: 'Data Fusion',
    presenter: 'Camila Reyes',
    status: 'presented',
    score: 6.3,
    votes: 29,
    startedAt: '08:45',
    accessCode: 'DU41XP',
    participants: [
      { id: 'P01', name: 'Camila Reyes', score: 6.5, raterCount: 10, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7', 'Estudiante 8'] },
      { id: 'P02', name: 'Roberto Silva', score: 6.2, raterCount: 9, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7'] },
      { id: 'P03', name: 'Martina González', score: 6.1, raterCount: 10, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7', 'Estudiante 8'] },
    ]
  },
  {
    id: 'GRP-02',
    name: 'Cloud Sparks',
    presenter: 'Nicolas Soto',
    status: 'presented',
    score: 5.8,
    votes: 26,
    startedAt: '09:10',
    accessCode: 'QW79LM',
    participants: [
      { id: 'P04', name: 'Nicolas Soto', score: 6.0, raterCount: 9, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7'] },
      { id: 'P05', name: 'Andrea Munoz', score: 5.7, raterCount: 9, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7'] },
      { id: 'P06', name: 'Felipe Rojas', score: 5.6, raterCount: 8, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6'] },
    ]
  },
  {
    id: 'GRP-03',
    name: 'Vision Lab',
    presenter: 'Anais Diaz',
    status: 'pending',
    score: null,
    votes: 0,
    startedAt: null,
    accessCode: null,
  },
  {
    id: 'GRP-04',
    name: 'Pixel Pioneers',
    presenter: 'Diego Araya',
    status: 'pending',
    score: null,
    votes: 0,
    startedAt: null,
    accessCode: null,
  },
  {
    id: 'GRP-05',
    name: 'Algo Norte',
    presenter: 'Javiera Mora',
    status: 'presented',
    score: 6.6,
    votes: 32,
    startedAt: '10:05',
    accessCode: 'PT56SN',
    participants: [
      { id: 'P07', name: 'Javiera Mora', score: 6.8, raterCount: 11, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7', 'Estudiante 8', 'Estudiante 9'] },
      { id: 'P08', name: 'Carlos Espinoza', score: 6.5, raterCount: 11, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7', 'Estudiante 8', 'Estudiante 9'] },
      { id: 'P09', name: 'Lucia Vargas', score: 6.5, raterCount: 10, raters: ['Prof. García', 'Prof. López', 'Estudiante 1', 'Estudiante 2', 'Estudiante 3', 'Estudiante 4', 'Estudiante 5', 'Estudiante 6', 'Estudiante 7', 'Estudiante 8'] },
    ]
  },
]
