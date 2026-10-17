import { BarChart3, Images, LayoutDashboard, Settings } from 'lucide-react';

// Cada item vira uma página React no futuro (pages/<Nome>.jsx).
export const NAV_ITEMS = [
  { id: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'publicacoes', label: 'Publicações', icon: Images },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];
