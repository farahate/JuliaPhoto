export const DEFAULT_EQUIPMENT = 'Acrensly 8K · Lente f=4.04mm f/1.8 · Tela Flip 3"';

export const DEFAULT_AVATAR_URL = '/assets/aistudio/Julia_foto_ae837286.jpg';

export const INITIAL_MODULES = [
  {
    key: 'mod_1',
    order: 1,
    title: 'Módulo 1: Dominando a Câmera',
    subtitle: 'Controle da lente grande-angular f/1.8, foco por meio-clique e tela flip 3".',
    accent: 'amber',
    icon: 'camera',
    isBonus: false,
  },
  {
    key: 'mod_2',
    order: 2,
    title: 'Módulo 2: Luz e Sombra',
    subtitle: 'Golden hour, luz de janela e contraluz aproveitando a abertura clara f/1.8.',
    accent: 'purple',
    icon: 'sun',
    isBonus: false,
  },
  {
    key: 'mod_3',
    order: 3,
    title: 'Módulo 3: Composição e Ângulos',
    subtitle: 'Regra dos terços, ângulos baixos dramáticos e linhas que guiam o olhar.',
    accent: 'emerald',
    icon: 'compass',
    isBonus: false,
  },
  {
    key: 'mod_4',
    order: 4,
    title: 'Módulo 4: Estética Digicam & Flash',
    subtitle: 'Flash direto Y2K, retrô noturno, close-up de detalhes e texturas urbanas.',
    accent: 'rose',
    icon: 'zap',
    isBonus: false,
  },
  {
    key: 'mod_5',
    order: 5,
    title: 'Módulo 5: Curadoria e Instagram',
    subtitle: 'Escolha a foto assinatura e monte a identidade visual do perfil @juliaphoto.',
    accent: 'cyan',
    icon: 'sparkles',
    isBonus: false,
  },
];

export const INITIAL_QUESTS = [
  // Módulo 1
  {
    key: 'quest_01',
    moduleKey: 'mod_1',
    order: 1,
    title: 'O Primeiro Clique sem Zoom Digital',
    description:
      'Escolha um objeto ou pessoa no seu quarto ou quintal e fotografe dando passos para chegar perto — nada de apertar o zoom digital!',
    cameraTip:
      'Sua lente fixa f=4.04mm é grande-angular e nítida. O zoom digital só recorta e perde qualidade; dê dois passos à frente para enquadrar melhor.',
    xpReward: 60,
    styleTag: 'street',
    isBonus: false,
  },
  {
    key: 'quest_02',
    moduleKey: 'mod_1',
    order: 2,
    title: 'Meio-Clique do Foco Perfeito',
    description:
      'Chegue bem perto de uma flor, xícara ou acessório favorito e trave o foco antes de clicar para criar desfoque natural atrás.',
    cameraTip:
      'Segure o disparador até a metade até o quadradinho verde travar no objeto. Com abertura f/1.8, chegar a ~15cm já borra o fundo!',
    xpReward: 70,
    styleTag: 'macro',
    isBonus: false,
  },
  {
    key: 'quest_03',
    moduleKey: 'mod_1',
    order: 3,
    title: 'Ângulo Criativo com a Tela Flip 3"',
    description:
      'Gire a tela flip de 3" para fazer um autorretrato espontâneo no espelho ou segurando a câmera bem perto do chão.',
    cameraTip:
      'Use a tela articulada para conferir o enquadramento sem contorcionismo. Mantenha os dois braços firmes junto ao corpo para evitar tremor.',
    xpReward: 80,
    styleTag: 'retrato',
    isBonus: false,
  },

  // Módulo 2
  {
    key: 'quest_04',
    moduleKey: 'mod_2',
    order: 4,
    title: 'Caçadora da Golden Hour',
    description:
      'Saia no fim da tarde (1h antes do pôr do sol) e capture o brilho dourado batendo de lado em uma folha, muro ou retrato.',
    cameraTip:
      'Posicione o sol na lateral ou atrás do assunto (nunca de frente para o rosto). Deixe o flash desligado para preservar os tons quentes.',
    xpReward: 100,
    styleTag: 'natureza',
    isBonus: false,
  },
  {
    key: 'quest_05',
    moduleKey: 'mod_2',
    order: 5,
    title: 'Janela Dramática & Sombra Suave',
    description:
      'Apague as luzes do ambiente e fotografe alguém (ou um objeto) perto de uma janela lateral, deixando um lado iluminado e outro na sombra.',
    cameraTip:
      'A lente f/1.8 deixa entrar muita luz mesmo dentro de casa. Desligue o flash e vire o assunto 45° para a janela.',
    xpReward: 90,
    styleTag: 'retrato',
    isBonus: false,
  },
  {
    key: 'quest_06',
    moduleKey: 'mod_2',
    order: 6,
    title: 'Contraluz Poético ao Ar Livre',
    description:
      'Coloque uma pessoa, planta ou silhueta na frente de uma fonte de luz forte e deixe as bordas brilharem com contorno dourado.',
    cameraTip:
      'Toque ou faça meio-clique no assunto principal (não no céu) para equilibrar a exposição e criar um halo luminoso no contorno.',
    xpReward: 100,
    styleTag: 'natureza',
    isBonus: false,
  },

  // Módulo 3
  {
    key: 'quest_07',
    moduleKey: 'mod_3',
    order: 7,
    title: 'Regra dos Terços na Vida Real',
    description:
      'Ative a grade 3x3 na tela da câmera e posicione o assunto principal em um dos cruzamentos laterais, deixando espaço para respiro.',
    cameraTip:
      'Evite colocar tudo sempre bem no centro. Na grande-angular 4.04mm, deslocar o assunto para o terço esquerdo ou direito conta uma história.',
    xpReward: 90,
    styleTag: 'street',
    isBonus: false,
  },
  {
    key: 'quest_08',
    moduleKey: 'mod_3',
    order: 8,
    title: 'Ângulo Baixo de Gigante',
    description:
      'Abaixe a câmera quase encostando no chão e aponte levemente para cima para fotografar tênis, escadas, árvores ou um amigo.',
    cameraTip:
      'A lente grande-angular f=4.04mm exagera a perspectiva quando chega perto do chão, deixando a cena com cara de capa de álbum.',
    xpReward: 110,
    styleTag: 'street',
    isBonus: false,
  },
  {
    key: 'quest_09',
    moduleKey: 'mod_3',
    order: 9,
    title: 'Linhas Guias na Cidade',
    description:
      'Encontre faixas de pedestre, corrimãos, corredores ou calçadas que levem o olhar de quem vê direto para o ponto principal da foto.',
    cameraTip:
      'Alinhe as linhas saindo dos cantos inferiores do quadro. Mantenha o horizonte retinho olhando pela tela flip.',
    xpReward: 110,
    styleTag: 'street',
    isBonus: false,
  },

  // Módulo 4
  {
    key: 'quest_10',
    moduleKey: 'mod_4',
    order: 10,
    title: 'Flash Direto Y2K à Noite',
    description:
      'Em um ambiente escuro ou à noite, ligue o flash direto da sua digicam e fotografe um look, amigos ou objetos brilhantes de perto.',
    cameraTip:
      'Fique a cerca de 1 a 1,5 metro de distância para o flash não estourar o branco e conseguir aquele contraste retrô anos 2000.',
    xpReward: 120,
    styleTag: 'digicam',
    isBonus: false,
  },
  {
    key: 'quest_11',
    moduleKey: 'mod_4',
    order: 11,
    title: 'Close-up Retrô de Objetos',
    description:
      'Monte uma mini composição de mesa (fones, óculos, caderno, bebida ou câmera) e clique com estética nostálgica de revista teen.',
    cameraTip:
      'Aproveite a luz natural + um toque leve de cores quentes. Dê meio-clique no objeto central e confira na tela de 3".',
    xpReward: 110,
    styleTag: 'macro',
    isBonus: false,
  },
  {
    key: 'quest_12',
    moduleKey: 'mod_4',
    order: 12,
    title: 'Reflexos & Texturas Noturnas',
    description:
      'Procure poças d’água, vitrines, CDs ou vidros refletindo luzes coloridas e registre um clique cheio de atmosfera.',
    cameraTip:
      'Desligue o flash para não bater no vidro! Encoste quase na superfície refletora usando o f/1.8 para capturar as luzes sem borrão.',
    xpReward: 125,
    styleTag: 'digicam',
    isBonus: false,
  },

  // Módulo 5
  {
    key: 'quest_13',
    moduleKey: 'mod_5',
    order: 13,
    title: 'Retrato Assinatura em f/1.8',
    description:
      'Faça um retrato natural de alguém especial (ou autorretrato) combinando luz suave, expressão espontânea e fundo limpo.',
    cameraTip:
      'Chegue na altura dos olhos da pessoa, afaste-a pelo menos 1,5m da parede atrás e trave o foco no olho mais próximo.',
    xpReward: 130,
    styleTag: 'retrato',
    isBonus: false,
  },
  {
    key: 'quest_14',
    moduleKey: 'mod_5',
    order: 14,
    title: 'Detalhe Poético do Seu Dia',
    description:
      'Registre uma cena simples que ninguém repararia — sombras no chão, textura da roupa, pétalas ou nuvens — com o seu olhar único.',
    cameraTip:
      'Use o Wi-Fi da Acrensly para passar direto para o celular e observar em tela cheia se o enquadramento respira bem.',
    xpReward: 130,
    styleTag: 'macro',
    isBonus: false,
  },
  {
    key: 'quest_15',
    moduleKey: 'mod_5',
    order: 15,
    title: 'Estreia no Feed @juliaphoto',
    description:
      'Envie a foto que mais representa o SEU estilo hoje para inaugurar oficialmente a identidade do perfil @juliaphoto!',
    cameraTip:
      'Aplique tudo o que dominou: zero zoom digital, foco travado, luz intencional e peça ao Tutor IA a legenda perfeita depois!',
    xpReward: 180,
    styleTag: 'digicam',
    isBonus: false,
  },
];

export const INITIAL_ACHIEVEMENTS = [
  {
    code: 'first_click',
    title: 'Primeiro Clique',
    description: 'Completou sua primeira missão prática na trilha.',
    badge_icon: 'aperture',
    condition: 'Complete 1 missão fotográfica',
    targetCount: 1,
    xp_bonus: 50,
  },
  {
    code: 'no_digital_zoom',
    title: 'Zero Zoom Digital',
    description: 'Dominou os fundamentos aproximando com os pés e a lente 4.04mm.',
    badge_icon: 'focus',
    condition: 'Complete o Módulo 1 (3 missões)',
    targetCount: 3,
    xp_bonus: 75,
  },
  {
    code: 'golden_hour',
    title: 'Caçadora da Golden Hour',
    description: 'Capturou a magia da luz dourada do fim de tarde.',
    badge_icon: 'sun',
    condition: 'Conclua a missão Caçadora da Golden Hour',
    targetCount: 1,
    xp_bonus: 100,
  },
  {
    code: 'low_angle',
    title: 'Mestre do Ângulo Baixo',
    description: 'Explorou perspectiva dramática rente ao chão.',
    badge_icon: 'arrow-up-right',
    condition: 'Conclua a missão Ângulo Baixo de Gigante',
    targetCount: 1,
    xp_bonus: 100,
  },
  {
    code: 'digicam_y2k',
    title: 'Vibe Digicam Y2K',
    description: 'Dominou o flash direto retrô e texturas noturnas.',
    badge_icon: 'zap',
    condition: 'Envie 2 fotos com estética digicam',
    targetCount: 2,
    xp_bonus: 120,
  },
  {
    code: 'macro_eye',
    title: 'Olhar Macro & Detalhes',
    description: 'Enxergou beleza nos pequenos objetos e texturas de perto.',
    badge_icon: 'sparkles',
    condition: 'Envie 2 fotos de macro ou detalhes',
    targetCount: 2,
    xp_bonus: 100,
  },
  {
    code: 'portrait_soul',
    title: 'Alma de Retratista',
    description: 'Capturou expressões naturais com abertura f/1.8.',
    badge_icon: 'user-check',
    condition: 'Envie 2 retratos aprovados pelo Tutor IA',
    targetCount: 2,
    xp_bonus: 110,
  },
  {
    code: 'streak_3',
    title: 'Ofensiva em Chamas',
    description: 'Manteve o ritmo fotográfico constante.',
    badge_icon: 'flame',
    condition: 'Alcance 3 missões concluídas em sequência',
    targetCount: 3,
    xp_bonus: 130,
  },
  {
    code: 'feed_debut',
    title: 'Estreia no Feed',
    description: 'Publicou sua foto assinatura para o perfil @juliaphoto.',
    badge_icon: 'instagram',
    condition: 'Conclua a missão Estreia no Feed',
    targetCount: 1,
    xp_bonus: 150,
  },
  {
    code: 'all_modules',
    title: 'Fotógrafa Completa',
    description: 'Completou todas as 15 missões da jornada inicial!',
    badge_icon: 'trophy',
    condition: 'Conclua 15 missões da trilha',
    targetCount: 15,
    xp_bonus: 300,
  },
];

export function createSeedBundleForUser(uid, displayName = 'Julia', photoURL = DEFAULT_AVATAR_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const safeUid = uid && /^[a-zA-Z0-9_\-]+$/.test(uid) ? uid : 'demo_julia';

  const userProfile = {
    uid: safeUid,
    displayName: (displayName || 'Julia').slice(0, 80),
    photoURL: (photoURL || DEFAULT_AVATAR_URL).slice(0, 500),
    totalXp: 0,
    level: 1,
    streak: 1,
    equipment: DEFAULT_EQUIPMENT,
    detected_style: 'Em Descoberta',
    styleCounts: {
      retrato: 0,
      natureza: 0,
      street: 0,
      macro: 0,
      digicam: 0,
    },
    lastActiveDate: today,
  };

  const modules = INITIAL_MODULES.map((mod) => ({
    id: `${safeUid}_${mod.key}`,
    userId: safeUid,
    order: mod.order,
    title: mod.title,
    subtitle: mod.subtitle,
    accent: mod.accent,
    icon: mod.icon,
    isBonus: mod.isBonus,
  }));

  const quests = INITIAL_QUESTS.map((quest, index) => ({
    id: `${safeUid}_${quest.key}`,
    userId: safeUid,
    moduleId: `${safeUid}_${quest.moduleKey}`,
    order: quest.order,
    title: quest.title,
    description: quest.description,
    cameraTip: quest.cameraTip,
    xpReward: quest.xpReward,
    status: index === 0 ? 'unlocked' : 'locked',
    styleTag: quest.styleTag,
    isBonus: quest.isBonus,
    photoUrl: '',
    aiStrength: '',
    aiSuggestion: '',
    aiMentorMessage: '',
    aiDetectedTags: [],
    completedAt: '',
  }));

  const achievements = INITIAL_ACHIEVEMENTS.map((ach) => ({
    id: `${safeUid}_ach_${ach.code}`,
    userId: safeUid,
    code: ach.code,
    title: ach.title,
    description: ach.description,
    badge_icon: ach.badge_icon,
    condition: ach.condition,
    targetCount: ach.targetCount,
    currentCount: 0,
    xp_bonus: ach.xp_bonus,
    unlocked_at: '',
  }));

  return { userProfile, modules, quests, achievements };
}
