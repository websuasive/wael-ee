// Application router. Five routes: root empty page, questionnaire, results, laboratory, fixtures.

import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';

import AssessmentView from '../views/AssessmentView.vue';
import ResultsView from '../views/ResultsView.vue';
import LaboratoryView from '../views/LaboratoryView.vue';
import LaboratoryDetailView from '../views/LaboratoryDetailView.vue';
import QuestionnaireView from '../views/QuestionnaireView.vue';
import EmptyView from '../views/EmptyView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', component: EmptyView },
  { path: '/assessment', name: 'assessment', component: QuestionnaireView },
  { path: '/results', name: 'results', component: ResultsView },
  { path: '/laboratory', name: 'laboratory', component: LaboratoryView },
  {
    path: '/laboratory/:protocol',
    name: 'laboratory-detail',
    component: LaboratoryDetailView,
  },
  { path: '/fixtures', name: 'fixtures', component: AssessmentView },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
