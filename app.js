// MaliBreed Pro - Application JavaScript
// Desarrollado para gestión de criaderos de perros Malinois

// Configuración de Vue.js
const { createApp, ref, computed, onMounted, watch } = Vue;

const app = createApp({
    setup() {
        // Estado para la navegación principal
        const activeTab = ref('dashboard');
        const tabs = ref([
            { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-chart-bar' },
            { id: 'dogs', name: 'Perros', icon: 'fas fa-dog' },
            { id: 'mating', name: 'Análisis de Cruza', icon: 'fas fa-dna' },
            { id: 'litters', name: 'Camadas', icon: 'fas fa-baby' }
        ]);
        
        // Datos principales
        const dogs = ref([]);
        const litters = ref([]);
        
        // Estadísticas globales
        const stats = computed(() => {
            return {
                totalDogs: dogs.value.length,
                totalLitters: litters.value.length,
                maleCount: dogs.value.filter(dog => dog.gender === 'M').length,
                femaleCount: dogs.value.filter(dog => dog.gender === 'F').length
            };
        });
        
        // Dashboard stats
        const dashboardStats = computed(() => {
            return [
                {
                    label: 'Total Perros',
                    value: stats.value.totalDogs,
                    icon: 'fas fa-dog',
                    bgColor: 'bg-primary'
                },
                {
                    label: 'Total Camadas',
                    value: stats.value.totalLitters,
                    icon: 'fas fa-baby',
                    bgColor: 'bg-secondary'
                },
                {
                    label: 'Índice Promedio',
                    value: calculateAverageIC() + '%',
                    icon: 'fas fa-dna',
                    bgColor: 'bg-green-500'
                }
            ];
        });
        
        // Calcular el promedio de IC de todas las camadas
        const calculateAverageIC = () => {
            if (litters.value.length === 0) return '0.00';
            const sum = litters.value.reduce((acc, litter) => acc + litter.ic, 0);
            return (sum / litters.value.length * 100).toFixed(2);
        };
        
        // Distribución de géneros para el dashboard
        const genderDistribution = computed(() => {
            const males = stats.value.maleCount;
            const females = stats.value.femaleCount;
            const total = males + females;
            
            return {
                males,
                females,
                malePercentage: total ? Math.round((males / total) * 100) : 0,
                femalePercentage: total ? Math.round((females / total) * 100) : 0
            };
        });
        
        // Top reproductores
        const topBreeders = computed(() => {
            const breeders = [];
            
            // Contar camadas y cachorros por reproductor
            dogs.value.forEach(dog => {
                const litterCount = litters.value.filter(litter => 
                    (dog.gender === 'M' && litter.sire.id === dog.id) || 
                    (dog.gender === 'F' && litter.dam.id === dog.id)
                ).length;
                
                if (litterCount > 0) {
                    // Contar cachorros
                    let puppyCount = 0;
                    litters.value.forEach(litter => {
                        if ((dog.gender === 'M' && litter.sire.id === dog.id) || 
                            (dog.gender === 'F' && litter.dam.id === dog.id)) {
                            puppyCount += litter.puppies.length;
                        }
                    });
                    
                    breeders.push({
                        id: dog.id,
                        name: dog.name,
                        gender: dog.gender,
                        litterCount,
                        puppyCount
                    });
                }
            });
            
            // Ordenar por número de camadas (descendente)
            return breeders.sort((a, b) => b.litterCount - a.litterCount).slice(0, 5);
        });
        
        // Estado para manejo de perros
        const dogFilters = ref({
            search: '',
            gender: '',
            ageGroup: '',
            title: ''
        });
        
        // Filtrado de perros
        const filteredDogs = computed(() => {
            return dogs.value.filter(dog => {
                // Filtro por texto de búsqueda
                if (dogFilters.value.search && 
                    !dog.name.toLowerCase().includes(dogFilters.value.search.toLowerCase()) &&
                    !dog.registrationNumber?.toLowerCase().includes(dogFilters.value.search.toLowerCase())) {
                    return false;
                }
                
                // Filtro por género
                if (dogFilters.value.gender && dog.gender !== dogFilters.value.gender) {
                    return false;
                }
                
                // Filtro por grupo de edad
                if (dogFilters.value.ageGroup) {
                    const ageInYears = calculateAgeInYears(dog.birthDate);
                    
                    if (dogFilters.value.ageGroup === 'puppy' && ageInYears >= 1) return false;
                    if (dogFilters.value.ageGroup === 'young' && (ageInYears < 1 || ageInYears > 3)) return false;
                    if (dogFilters.value.ageGroup === 'adult' && (ageInYears < 4 || ageInYears > 7)) return false;
                    if (dogFilters.value.ageGroup === 'senior' && ageInYears < 8) return false;
                }
                
                // Filtro por título
                if (dogFilters.value.title && (!dog.titles || !dog.titles.includes(dogFilters.value.title))) {
                    return false;
                }
                
                return true;
            });
        });
        
        // Estado para agregar un nuevo perro
        const showAddDogModal = ref(false);
        const newDog = ref({
            name: '',
            registrationNumber: '',
            gender: '',
            birthDate: '',
            sireId: '',
            damId: '',
            health: [],
            titles: [],
            notes: ''
        });
        
        // Obtener listas filtradas de perros por género para los selects
        const maleDogs = computed(() => dogs.value.filter(dog => dog.gender === 'M'));
        const femaleDogs = computed(() => dogs.value.filter(dog => dog.gender === 'F'));
        
        // Opciones para salud y títulos
        const healthConditions = ref([
            { id: 'hd', name: 'Displasia de Cadera (HD): A' },
            { id: 'ed', name: 'Displasia de Codo (ED): 0' },
            { id: 'dm', name: 'Mielopatía Degenerativa (DM): N/N' },
            { id: 'heart', name: 'Cardíaco: Normal' },
            { id: 'eyes', name: 'Ojos: Normal' },
            { id: 'thyroid', name: 'Tiroides: Normal' }
        ]);
        
        const availableTitles = ref([
            'IGP1', 'IGP2', 'IGP3',
            'IPO1', 'IPO2', 'IPO3',
            'MR1', 'MR2', 'MR3',
            'BH', 'ZTP',
            'CH. Nacional', 'CH. Internacional'
        ]);
        
        // Estado para detalles de perro
        const showDogDetailsModal = ref(false);
        const selectedDogDetails = ref(null);
        const pedigreeLoaded = ref(false);
        
        // Estado para análisis de cruza
        const matingSearch = ref({
            sire: '',
            dam: ''
        });
        const sireSearchResults = ref([]);
        const damSearchResults = ref([]);
        const selectedSire = ref(null);
        const selectedDam = ref(null);
        const matingAnalysis = ref(null);
        
        // Estado para camadas
        const litterFilters = ref({
            search: '',
            year: '',
            status: ''
        });
        
        // Años disponibles para el filtro de camadas
        const availableYears = computed(() => {
            const years = new Set();
            litters.value.forEach(litter => {
                const year = new Date(litter.birthDate).getFullYear();
                years.add(year);
            });
            return Array.from(years).sort((a, b) => b - a); // Ordenados de más reciente a más antiguo
        });
        
        // Filtrado de camadas
        const filteredLitters = computed(() => {
            return litters.value.filter(litter => {
                // Filtro por texto de búsqueda
                if (litterFilters.value.search && 
                    !litter.identifier.toLowerCase().includes(litterFilters.value.search.toLowerCase()) &&
                    !litter.sire.name.toLowerCase().includes(litterFilters.value.search.toLowerCase()) &&
                    !litter.dam.name.toLowerCase().includes(litterFilters.value.search.toLowerCase())) {
                    return false;
                }
                
                // Filtro por año
                if (litterFilters.value.year) {
                    const litterYear = new Date(litter.birthDate).getFullYear();
                    if (litterYear != litterFilters.value.year) return false;
                }
                
                // Filtro por estado
                if (litterFilters.value.status && litter.status !== litterFilters.value.status) {
                    return false;
                }
                
                return true;
            });
        });
        
        // Estado para detalles de camada
        const showLitterDetailsModal = ref(false);
        const selectedLitterDetails = ref(null);
        const showAddPuppyForm = ref(false);
        const newPuppy = ref({
            name: '',
            gender: '',
            status: 'available',
            description: ''
        });
        
        // Estado para notificaciones toast
        const toastTitle = ref('');
        const toastMessage = ref('');
        const toastIcon = ref('');
        
        // Inicialización y carga de datos
        onMounted(() => {
            loadData();
        });
        
        // Función para cargar datos desde localStorage
        const loadData = () => {
            // Cargar perros
            const savedDogs = localStorage.getItem('malibreed_dogs');
            if (savedDogs) {
                dogs.value = JSON.parse(savedDogs);
            } else {
                // Cargar datos de ejemplo si no hay datos guardados
                loadSampleData();
            }
            // console.log('Perros cargados:', dogs.value);
            // Cargar camadas
            const savedLitters = localStorage.getItem('malibreed_litters');
            if (savedLitters) {
                litters.value = JSON.parse(savedLitters);
            }
        };
        
        // Guardar datos en localStorage
        const saveData = () => {
            localStorage.setItem('malibreed_dogs', JSON.stringify(dogs.value));
            localStorage.setItem('malibreed_litters', JSON.stringify(litters.value));
        };
        
        // Cargar datos de ejemplo para demo
        const loadSampleData = () => {
            // Generación 1 - Ancestros más lejanos (5 generaciones atrás)
            const gen1Dogs = [
                {
                    id: 'dog_g1_m1',
                    name: 'Urak des Loups Mutins',
                    registrationNumber: 'LOSH/BOM/12345/05',
                    gender: 'M',
                    birthDate: '2005-03-12',
                    sireId: '',
                    damId: '',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['IPO3', 'KNPV PH1'],
                    notes: 'Perro fundador de líneas de trabajo modernas. Temperamento equilibrado y fuerte estructura.'
                },
                {
                    id: 'dog_g1_f1',
                    name: 'Fiona van Joefarm',
                    registrationNumber: 'NHSB/BOM/67890/06',
                    gender: 'F',
                    birthDate: '2006-06-20',
                    sireId: '',
                    damId: '',
                    health: ['Displasia de Cadera (HD): A', 'Ojos: Normal'],
                    titles: ['IPO2'],
                    notes: 'Hembra de línea de trabajo holandesa. Excelente carácter y agilidad.'
                },
                {
                    id: 'dog_g1_m2',
                    name: 'Arko vom Wolfsstrom',
                    registrationNumber: 'SZ/BOM/78901/04',
                    gender: 'M',
                    birthDate: '2004-04-05',
                    sireId: '',
                    damId: '',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['IPO3', 'FH2', 'SchH3'],
                    notes: 'Reproductor legendario. Gran impulso y mordida firme.'
                },
                {
                    id: 'dog_g1_f2',
                    name: 'Diva du Royaume des Ombres',
                    registrationNumber: 'LOF/BOM/45678/05',
                    gender: 'F',
                    birthDate: '2005-09-15',
                    sireId: '',
                    damId: '',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['MR1', 'RING III'],
                    notes: 'Línea francesa de alto rendimiento. Gran velocidad y agilidad.'
                },
                {
                    id: 'dog_g1_m3',
                    name: 'Viggo du Crépuscule Rouge',
                    registrationNumber: 'LOF/BOM/34562/06',
                    gender: 'M',
                    birthDate: '2006-11-30',
                    sireId: '',
                    damId: '',
                    health: ['Displasia de Cadera (HD): A', 'Cardíaco: Normal'],
                    titles: ['MR3', 'FR III'],
                    notes: 'Productor de líneas de alto rendimiento en mondioring.'
                },
                {
                    id: 'dog_g1_f3',
                    name: 'Elza van Valescas',
                    registrationNumber: 'NHSB/BOM/56789/07',
                    gender: 'F',
                    birthDate: '2007-03-25',
                    sireId: '',
                    damId: '',
                    health: ['Displasia de Cadera (HD): A', 'Mielopatía Degenerativa (DM): N/N'],
                    titles: ['IPO1', 'KNPV PH1'],
                    notes: 'Muy buena genética para trabajo policial.'
                }
            ];
            
            // Generación 2 - Bisabuelos (3-4 generaciones atrás)
            const gen2Dogs = [
                {
                    id: 'dog_g2_m1',
                    name: 'Wolf vom Königshaus',
                    registrationNumber: 'SZ/BOM/23451/09',
                    gender: 'M',
                    birthDate: '2009-01-10',
                    sireId: 'dog_g1_m1',
                    damId: 'dog_g1_f1',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['IPO3', 'SchH3'],
                    notes: 'Excelente estructura y temperamento estable.'
                },
                {
                    id: 'dog_g2_f1',
                    name: 'Amber des Champions',
                    registrationNumber: 'LOSH/BOM/56789/10',
                    gender: 'F',
                    birthDate: '2010-03-22',
                    sireId: 'dog_g1_m2',
                    damId: 'dog_g1_f2',
                    health: ['Displasia de Cadera (HD): A', 'Mielopatía Degenerativa (DM): N/N'],
                    titles: ['MR2', 'IPO2'],
                    notes: 'Combinación de líneas alemanas y francesas. Excelente morfología.'
                },
                {
                    id: 'dog_g2_m2',
                    name: 'Tyson de la Forge',
                    registrationNumber: 'LOF/BOM/98765/08',
                    gender: 'M',
                    birthDate: '2008-12-05',
                    sireId: 'dog_g1_m3',
                    damId: 'dog_g1_f2',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['RING III', 'MR3'],
                    notes: 'Reproductor de alto rendimiento en ring francés.'
                },
                {
                    id: 'dog_g2_f2',
                    name: 'Xena van der Polizeihund',
                    registrationNumber: 'NHSB/BOM/34567/10',
                    gender: 'F',
                    birthDate: '2010-08-14',
                    sireId: 'dog_g1_m1',
                    damId: 'dog_g1_f3',
                    health: ['Displasia de Cadera (HD): A', 'Ojos: Normal'],
                    titles: ['KNPV PH1', 'IPO2'],
                    notes: 'Línea de trabajo policial. Excelente olfato y rastreo.'
                },
                {
                    id: 'dog_g2_m3',
                    name: 'Basco vom Wolfsrudel',
                    registrationNumber: 'SZ/BOM/45678/11',
                    gender: 'M',
                    birthDate: '2011-02-18',
                    sireId: 'dog_g1_m2',
                    damId: 'dog_g1_f1',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0', 'Cardíaco: Normal'],
                    titles: ['IPO3', 'FH2'],
                    notes: 'Excelente mordida y temperamento estable.'
                },
                {
                    id: 'dog_g2_f3',
                    name: 'Maya du Château Fort',
                    registrationNumber: 'LOF/BOM/12345/11',
                    gender: 'F',
                    birthDate: '2011-06-30',
                    sireId: 'dog_g1_m3',
                    damId: 'dog_g1_f3',
                    health: ['Displasia de Cadera (HD): A', 'Mielopatía Degenerativa (DM): N/N'],
                    titles: ['FR I', 'BH'],
                    notes: 'Buena línea para trabajo y deporte. Temperamento equilibrado.'
                }
            ];
            
            // Generación 3 - Abuelos (2-3 generaciones atrás)
            const gen3Dogs = [
                {
                    id: 'dog_g3_m1',
                    name: 'Quinto du Royaume',
                    registrationNumber: 'LOSH/BOM/34567/13',
                    gender: 'M',
                    birthDate: '2013-03-20',
                    sireId: 'dog_g2_m1',
                    damId: 'dog_g2_f1',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0', 'Cardíaco: Normal'],
                    titles: ['IPO3', 'MR2', 'CH. Nacional'],
                    notes: 'Reproductor de alto nivel con excelente línea de sangre belga.'
                },
                {
                    id: 'dog_g3_f1',
                    name: 'Laika vom Sturm',
                    registrationNumber: 'SZ/BOM/67890/14',
                    gender: 'F',
                    birthDate: '2014-04-12',
                    sireId: 'dog_g2_m3',
                    damId: 'dog_g2_f2',
                    health: ['Displasia de Cadera (HD): A', 'Ojos: Normal'],
                    titles: ['IPO2', 'ZTP'],
                    notes: 'Hembra de excelente estructura y temperamento equilibrado.'
                },
                {
                    id: 'dog_g3_m2',
                    name: 'Django de la Force Tranquille',
                    registrationNumber: 'LOF/BOM/23456/12',
                    gender: 'M',
                    birthDate: '2012-11-15',
                    sireId: 'dog_g2_m2',
                    damId: 'dog_g2_f3',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['MR3', 'FR III', 'CH. Internacional'],
                    notes: 'Campeón internacional en mondioring. Excelente impulso y defensa.'
                },
                {
                    id: 'dog_g3_f2',
                    name: 'Venus von der Schutzhund',
                    registrationNumber: 'SZ/BOM/56789/15',
                    gender: 'F',
                    birthDate: '2015-07-03',
                    sireId: 'dog_g2_m3',
                    damId: 'dog_g2_f1',
                    health: ['Displasia de Cadera (HD): A', 'Mielopatía Degenerativa (DM): N/N'],
                    titles: ['IPO3', 'BH'],
                    notes: 'Reproductora de alta calidad para trabajo y deporte.'
                }
            ];
            
            // Generación 4 - Padres (1-2 generaciones atrás)
            const gen4Dogs = [
                {
                    id: 'dog_g4_m1',
                    name: 'Max du Royaume',
                    registrationNumber: 'LOSH/BOM/34567/18',
                    gender: 'M',
                    birthDate: '2018-03-20',
                    sireId: 'dog_g3_m1',
                    damId: 'dog_g3_f1',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0', 'Cardíaco: Normal'],
                    titles: ['IPO3', 'MR2', 'CH. Nacional'],
                    notes: 'Reproductor con excelente línea de sangre belga.'
                },
                {
                    id: 'dog_g4_f1',
                    name: 'Enya du Crépuscule',
                    registrationNumber: 'LOF/BOM/12345/17',
                    gender: 'F',
                    birthDate: '2017-05-12',
                    sireId: 'dog_g3_m2',
                    damId: 'dog_g3_f2',
                    health: ['Displasia de Cadera (HD): A', 'Mielopatía Degenerativa (DM): N/N'],
                    titles: ['MR1', 'IPO2'],
                    notes: 'Hembra con excelente drive y estructura. Líneas francesas.'
                },
                {
                    id: 'dog_g4_m2',
                    name: 'Rex vom Wolfsblut',
                    registrationNumber: 'CMKU/BOM/12345/19',
                    gender: 'M',
                    birthDate: '2019-05-15',
                    sireId: 'dog_g3_m1',
                    damId: 'dog_g3_f2',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['IGP3', 'IPO2'],
                    notes: 'Excelente temperamento y estructura. Línea de trabajo.'
                },
                {
                    id: 'dog_g4_f2',
                    name: 'Luna von der Malinois',
                    registrationNumber: 'CMKU/BOM/23456/20',
                    gender: 'F',
                    birthDate: '2020-07-10',
                    sireId: 'dog_g3_m2',
                    damId: 'dog_g3_f1',
                    health: ['Displasia de Cadera (HD): A', 'Mielopatía Degenerativa (DM): N/N'],
                    titles: ['IGP1', 'BH'],
                    notes: 'Perra de excelente carácter. Alta presa y agilidad.'
                }
            ];
            
            // Generación 5 - Perros actuales jóvenes
            const gen5Dogs = [
                {
                    id: 'dog_g5_m1',
                    name: 'Thor de la Fuerza',
                    registrationNumber: 'FCME/BOM/56789/19',
                    gender: 'M',
                    birthDate: '2019-11-27',
                    sireId: 'dog_g4_m1',
                    damId: 'dog_g4_f1',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['IGP2', 'IPO1'],
                    notes: 'Excelente guardián y estructura fuerte.'
                },
                {
                    id: 'dog_g5_f1',
                    name: 'Stella del Viento',
                    registrationNumber: 'FCME/BOM/67890/20',
                    gender: 'F',
                    birthDate: '2020-09-03',
                    sireId: 'dog_g4_m2',
                    damId: 'dog_g4_f1',
                    health: ['Displasia de Cadera (HD): A', 'Ojos: Normal'],
                    titles: ['BH', 'IGP1'],
                    notes: 'Temperamento equilibrado. Excelente para deporte y trabajo.'
                },
                {
                    id: 'dog_g5_m2',
                    name: 'Drako vom Dunkel',
                    registrationNumber: 'CMKU/BOM/78901/21',
                    gender: 'M',
                    birthDate: '2021-02-10',
                    sireId: 'dog_g4_m1',
                    damId: 'dog_g4_f2',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['BH', 'IGP1'],
                    notes: 'Joven con gran potencial para trabajo y deporte.'
                },
                {
                    id: 'dog_g5_f2',
                    name: 'Nala du Crépuscule',
                    registrationNumber: 'LOSH/BOM/45678/21',
                    gender: 'F',
                    birthDate: '2021-01-05',
                    sireId: 'dog_g4_m2',
                    damId: 'dog_g4_f2',
                    health: ['Displasia de Cadera (HD): A'],
                    titles: ['BH'],
                    notes: 'Joven promesa con excelente genética.'
                },
                {
                    id: 'dog_g5_m3',
                    name: 'Orion del Fuego',
                    registrationNumber: 'FCME/BOM/23456/22',
                    gender: 'M',
                    birthDate: '2022-04-15',
                    sireId: 'dog_g4_m2',
                    damId: 'dog_g5_f1',
                    health: ['Displasia de Cadera (HD): A', 'Displasia de Codo (ED): 0'],
                    titles: ['BH'],
                    notes: 'Joven macho con gran estructura y temperamento.'
                },
                {
                    id: 'dog_g5_f3',
                    name: 'Xena de la Tormenta',
                    registrationNumber: 'FCME/BOM/34567/22',
                    gender: 'F',
                    birthDate: '2022-08-20',
                    sireId: 'dog_g5_m1',
                    damId: 'dog_g4_f2',
                    health: ['Displasia de Cadera (HD): A'],
                    titles: [],
                    notes: 'Joven hembra con gran potencial para deporte.'
                }
            ];
            
            // Unir todos los perros en un array
            const sampleDogs = [
                ...gen1Dogs,
                ...gen2Dogs,
                ...gen3Dogs,
                ...gen4Dogs,
                ...gen5Dogs
            ];
            
            dogs.value = sampleDogs;
            
            // Crear camadas de ejemplo
            const sampleLitters = [
                // Camada 1 - Muy baja consanguinidad
                {
                    id: 'litter1',
                    identifier: 'A de Casa Vivalco',
                    birthDate: '2023-06-15',
                    sire: {
                        id: 'dog_g4_m2',
                        name: 'Rex vom Wolfsblut'
                    },
                    dam: {
                        id: 'dog_g4_f2',
                        name: 'Luna von der Malinois'
                    },
                    status: 'active',
                    ic: 0.015, // 1.5%
                    alc: 0.12, // 12%
                    puppies: [
                        {
                            id: 'pup1',
                            name: 'Athos de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro dominante. Alta presa y buena estructura.'
                        },
                        {
                            id: 'pup2',
                            name: 'Ares de Casa Vivalco',
                            gender: 'M',
                            status: 'available',
                            description: 'Equilibrado y sociable. Potencial para deporte.'
                        },
                        {
                            id: 'pup3',
                            name: 'Artemisa de Casa Vivalco',
                            gender: 'F',
                            status: 'reserved',
                            description: 'Cachorra con gran impulso de presa y agilidad.'
                        },
                        {
                            id: 'pup4',
                            name: 'Atenea de Casa Vivalco',
                            gender: 'F',
                            status: 'sold',
                            description: 'Cachorra con excelente estructura y temperamento.'
                        }
                    ]
                },
                
                // Camada 2 - Consanguinidad media
                {
                    id: 'litter2',
                    identifier: 'B de Casa Vivalco',
                    birthDate: '2023-09-22',
                    sire: {
                        id: 'dog_g5_m1',
                        name: 'Thor de la Fuerza'
                    },
                    dam: {
                        id: 'dog_g5_f1',
                        name: 'Stella del Viento'
                    },
                    status: 'active',
                    ic: 0.078, // 7.8%
                    alc: 0.20, // 20%
                    puppies: [
                        {
                            id: 'pup5',
                            name: 'Braco de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro con buena estructura y alta presa.'
                        },
                        {
                            id: 'pup6',
                            name: 'Bruma de Casa Vivalco',
                            gender: 'F',
                            status: 'reserved',
                            description: 'Cachorra equilibrada con buen potencial para deporte.'
                        },
                        {
                            id: 'pup7',
                            name: 'Baco de Casa Vivalco',
                            gender: 'M',
                            status: 'available',
                            description: 'Cachorro con alto drive y temperamento estable.'
                        }
                    ]
                },
                
                // Camada 3 - Alta consanguinidad
                {
                    id: 'litter3',
                    identifier: 'C de Casa Vivalco',
                    birthDate: '2022-12-10',
                    sire: {
                        id: 'dog_g5_m2',
                        name: 'Drako vom Dunkel'
                    },
                    dam: {
                        id: 'dog_g5_f2',
                        name: 'Nala du Crépuscule'
                    },
                    status: 'completed',
                    ic: 0.125, // 12.5%
                    alc: 0.32, // 32%
                    puppies: [
                        {
                            id: 'pup8',
                            name: 'Ciro de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro con buen temperamento pero tamaño menor al estándar.'
                        },
                        {
                            id: 'pup9',
                            name: 'Cora de Casa Vivalco',
                            gender: 'F',
                            status: 'sold',
                            description: 'Cachorra con buen drive y estructura correcta.'
                        },
                        {
                            id: 'pup10',
                            name: 'Cesar de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro con estructura excelente pero temperamento menos estable.'
                        },
                        {
                            id: 'pup11',
                            name: 'Cloe de Casa Vivalco',
                            gender: 'F',
                            status: 'sold',
                            description: 'Cachorra con buen potencial para deporte.'
                        },
                        {
                            id: 'pup12',
                            name: 'Caos de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro con problemas de salud menores pero buen temperamento.'
                        }
                    ]
                },
                
                // Camada 4 - Muy baja consanguinidad, líneas distantes
                {
                    id: 'litter4',
                    identifier: 'D de Casa Vivalco',
                    birthDate: '2024-02-15',
                    sire: {
                        id: 'dog_g3_m2',
                        name: 'Django de la Force Tranquille'
                    },
                    dam: {
                        id: 'dog_g5_f3',
                        name: 'Xena de la Tormenta'
                    },
                    status: 'active',
                    ic: 0.0082, // 0.82%
                    alc: 0.09, // 9%
                    puppies: [
                        {
                            id: 'pup13',
                            name: 'Duna de Casa Vivalco',
                            gender: 'F',
                            status: 'available',
                            description: 'Cachorra con excelente morfología y temperamento equilibrado.'
                        },
                        {
                            id: 'pup14',
                            name: 'Darko de Casa Vivalco',
                            gender: 'M',
                            status: 'available',
                            description: 'Cachorro con alta presa y excelente impulso de trabajo.'
                        },
                        {
                            id: 'pup15',
                            name: 'Diana de Casa Vivalco',
                            gender: 'F',
                            status: 'reserved',
                            description: 'Cachorra con gran agilidad y muy sociable.'
                        },
                        {
                            id: 'pup16',
                            name: 'Dante de Casa Vivalco',
                            gender: 'M',
                            status: 'available',
                            description: 'Cachorro con estructura robusta y temperamento estable.'
                        },
                        {
                            id: 'pup17',
                            name: 'Diva de Casa Vivalco',
                            gender: 'F',
                            status: 'reserved',
                            description: 'Cachorra con gran potencial para trabajo y deporte.'
                        },
                        {
                            id: 'pup18',
                            name: 'Duke de Casa Vivalco',
                            gender: 'M',
                            status: 'reserved',
                            description: 'Cachorro con excelente carácter y estructura.'
                        }
                    ]
                },
                
                // Camada 5 - Media consanguinidad (medio hermanos)
                {
                    id: 'litter5',
                    identifier: 'E de Casa Vivalco',
                    birthDate: '2023-04-05',
                    sire: {
                        id: 'dog_g4_m1',
                        name: 'Max du Royaume'
                    },
                    dam: {
                        id: 'dog_g5_f2',
                        name: 'Nala du Crépuscule'
                    },
                    status: 'completed',
                    ic: 0.0625, // 6.25%
                    alc: 0.18, // 18%
                    puppies: [
                        {
                            id: 'pup19',
                            name: 'Eros de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro con excelente estructura y temperamento estable.'
                        },
                        {
                            id: 'pup20',
                            name: 'Ebano de Casa Vivalco',
                            gender: 'M',
                            status: 'sold',
                            description: 'Cachorro con gran potencial para trabajo policial.'
                        },
                        {
                            id: 'pup21',
                            name: 'Eva de Casa Vivalco',
                            gender: 'F',
                            status: 'sold',
                            description: 'Cachorra con carácter equilibrado y buena morfología.'
                        },
                        {
                            id: 'pup22',
                            name: 'Elektra de Casa Vivalco',
                            gender: 'F',
                            status: 'sold',
                            description: 'Cachorra con excelente drive y agresión controlada.'
                        }
                    ]
                },
                
                // Camada 6 - Planeada para el futuro
                {
                    id: 'litter6',
                    identifier: 'F de Casa Vivalco',
                    birthDate: '2024-06-20', // Fecha futura
                    sire: {
                        id: 'dog_g5_m3',
                        name: 'Orion del Fuego'
                    },
                    dam: {
                        id: 'dog_g5_f3',
                        name: 'Xena de la Tormenta'
                    },
                    status: 'planned',
                    ic: 0.046, // 4.6%
                    alc: 0.15, // 15%
                    puppies: [] // Sin cachorros aún
                }
            ];
            
            litters.value = sampleLitters;
            
            // Guardar en localStorage
            saveData();
            
            // Mostrar notificación
            showToast('Datos de ejemplo cargados', 'Se han cargado perros y camadas de ejemplo para demo', 'fas fa-info-circle text-blue-500');
        };
        
        
        // Función para mostrar detalles de un perro
        const showDogDetails = (dog) => {
            // Enriquecer con información de parentesco
            const enrichedDog = { ...dog };
            
            // Agregar información del padre
            if (dog.sireId) {
                enrichedDog.sire = dogs.value.find(d => d.id === dog.sireId);
            }
            
            // Agregar información de la madre
            if (dog.damId) {
                enrichedDog.dam = dogs.value.find(d => d.id === dog.damId);
            }
            
            // Buscar descendencia
            enrichedDog.offspring = [];
            
            // Descendencia en perros registrados
            dogs.value.forEach(d => {
                if (d.sireId === dog.id || d.damId === dog.id) {
                    const offspring = { ...d };
                    
                    // Añadir información del otro progenitor
                    if (d.sireId === dog.id && d.damId) {
                        offspring.otherParent = dogs.value.find(parent => parent.id === d.damId);
                    } else if (d.damId === dog.id && d.sireId) {
                        offspring.otherParent = dogs.value.find(parent => parent.id === d.sireId);
                    }
                    
                    enrichedDog.offspring.push(offspring);
                }
            });
            
            // Descendencia en camadas (cachorros no registrados como perros)
            litters.value.forEach(litter => {
                if (litter.sire.id === dog.id || litter.dam.id === dog.id) {
                    litter.puppies.forEach(puppy => {
                        // Verificar que no esté ya registrado como perro
                        const isRegistered = dogs.value.some(d => 
                            d.name === puppy.name && 
                            ((litter.sire.id === dog.id && d.sireId === dog.id) || 
                             (litter.dam.id === dog.id && d.damId === dog.id))
                        );
                        
                        if (!isRegistered) {
                            const offspring = { ...puppy, birthDate: litter.birthDate };
                            
                            // Añadir información del otro progenitor
                            if (litter.sire.id === dog.id) {
                                offspring.otherParent = litter.dam;
                            } else {
                                offspring.otherParent = litter.sire;
                            }
                            
                            enrichedDog.offspring.push(offspring);
                        }
                    });
                }
            });
            
            selectedDogDetails.value = enrichedDog;
            showDogDetailsModal.value = true;
            
            // Simular carga de pedigree
            pedigreeLoaded.value = false;
            setTimeout(() => {
                pedigreeLoaded.value = true;
            }, 1000);
        };
        
        // Función para agregar un nuevo perro
        const addNewDog = () => {
            const dogId = 'dog_' + Date.now();
            
            const dogToAdd = {
                id: dogId,
                ...newDog.value
            };
            
            dogs.value.push(dogToAdd);
            saveData();
            
            // Reset form
            newDog.value = {
                name: '',
                registrationNumber: '',
                gender: '',
                birthDate: '',
                sireId: '',
                damId: '',
                health: [],
                titles: [],
                notes: ''
            };
            
            showAddDogModal.value = false;
            
            // Mostrar notificación
            showToast('Perro registrado', `${dogToAdd.name} ha sido agregado correctamente`, 'fas fa-check-circle text-green-500');
        };
        
        // Funciones para el análisis de cruza
        const searchSires = () => {
            if (!matingSearch.value.sire.trim()) {
                sireSearchResults.value = [];
                return;
            }
        
            const search = matingSearch.value.sire.toLowerCase();
            sireSearchResults.value = dogs.value.filter(dog => 
                dog.gender === 'M' && dog.name.toLowerCase().includes(search)
            ).slice(0, 5);
        };
        
        const searchDams = () => {
            if (!matingSearch.value.dam.trim()) {
                damSearchResults.value = [];
                return;
            }
        
            const search = matingSearch.value.dam.toLowerCase();
            damSearchResults.value = dogs.value.filter(dog =>
                dog.gender === 'F' && dog.name.toLowerCase().includes(search)
            ).slice(0, 5);
        };
        
        const selectSire = (dog) => {
            selectedSire.value = dog;
            matingSearch.value.sire = dog.name;
            sireSearchResults.value = [];
        };
        
        const selectDam = (dog) => {
            selectedDam.value = dog;
            matingSearch.value.dam = dog.name;
            damSearchResults.value = [];
        };
        
        // Función para analizar la compatibilidad de la cruza
        const analyzeMatching = () => {
            if (!selectedSire.value || !selectedDam.value) {
                return;
            }
            
            // Obtenemos el pedigree de ambos perros hasta 5 generaciones
            const sirePedigree = getPedigree(selectedSire.value.id, 5);
            const damPedigree = getPedigree(selectedDam.value.id, 5);
            
            // Encontrar ancestros comunes
            const commonAncestors = findCommonAncestors(sirePedigree, damPedigree);
            
            // Calcular IC (Inbreeding Coefficient) - Método simplificado
            let ic = 0;
            commonAncestors.forEach(ancestor => {
                // Fórmula: Sum[ (0.5)^(n1+n2+1) * (1 + Fa) ] donde:
                // n1 = generaciones entre el padre y el ancestro común
                // n2 = generaciones entre la madre y el ancestro común
                // Fa = coeficiente de consanguinidad del ancestro común (asumimos 0 para simplificar)
                const power = ancestor.sireGen + ancestor.damGen + 1;
                ancestor.contribution = Math.pow(0.5, power);
                ic += ancestor.contribution;
            });
            
            // Si son hermanos completos o medios hermanos, ajustamos el IC
            if (isSiblings(selectedSire.value, selectedDam.value)) {
                ic = Math.max(ic, 0.25); // 25% mínimo para hermanos completos
            } else if (isHalfSiblings(selectedSire.value, selectedDam.value)) {
                ic = Math.max(ic, 0.125); // 12.5% mínimo para medio hermanos
            }
            
            // Si no hay ancestros comunes encontrados, pero sabemos de relaciones cercanas
            // Utilizamos un valor mínimo basado en los pedigrees conocidos
            if (commonAncestors.length === 0) {
                const sireKnownGenerations = getKnownGenerations(selectedSire.value);
                const damKnownGenerations = getKnownGenerations(selectedDam.value);
                
                // Si hay pocas generaciones conocidas, asignamos un valor básico de consanguinidad
                if (sireKnownGenerations < 3 || damKnownGenerations < 3) {
                    ic = Math.random() * 0.04; // Valor aleatorio hasta 4%
                } else {
                    ic = Math.random() * 0.015; // Valor aleatorio bajo para perros sin relación cercana
                }
            }
            
            // Calcular ALC (Ancestor Loss Coefficient) - Método simplificado
            // En una app real, sería calculado analizando el pedigree completo 
            // y contando la pérdida de ancestros únicos
            
            // Para demo, simulamos:
            // - A mayor IC, mayor ALC
            // - Para perros relacionados, ALC más alto
            const isRelated = isSiblings(selectedSire.value, selectedDam.value) || 
                              isHalfSiblings(selectedSire.value, selectedDam.value) ||
                              commonAncestors.length > 0;
            
            let alc = 0;
            if (isRelated) {
                alc = 0.15 + ic * 1.2 + Math.random() * 0.1;
            } else {
                alc = 0.05 + ic * 0.8 + Math.random() * 0.1;
            }
            
            // Limitar el ALC a un rango razonable (5% a 40%)
            alc = Math.max(0.05, Math.min(0.4, alc));
            
            // Determinar si la cruza es recomendable
            const recommended = ic < 0.10 && alc < 0.30;
            
            // Generar texto de recomendación
            let recommendation = '';
            if (recommended) {
                if (ic < 0.03) {
                    recommendation = 'Esta cruza presenta un nivel de consanguinidad muy bajo y una diversidad genética aceptable. Es altamente recomendable.';
                } else {
                    recommendation = 'Esta cruza presenta un nivel de consanguinidad aceptable y una diversidad genética suficiente. Es recomendable, pero considere monitorear la consanguinidad en futuras generaciones.';
                }
            } else {
                if (ic >= 0.10) {
                    recommendation = 'El índice de consanguinidad es demasiado alto. Esta cruza podría aumentar el riesgo de problemas genéticos en la descendencia.';
                } else {
                    recommendation = 'La pérdida de diversidad genética es significativa. Considere buscar una pareja con mayor distancia genética.';
                }
            }
            
            // Guardar análisis
            matingAnalysis.value = {
                sire: selectedSire.value,
                dam: selectedDam.value,
                ic,
                alc,
                commonAncestors,
                recommended,
                recommendation
            };
        };
        
        // Función para obtener el pedigree de un perro hasta n generaciones
        const getPedigree = (dogId, generations) => {
            if (generations <= 0 || !dogId) return {};
            
            const dog = dogs.value.find(d => d.id === dogId);
            if (!dog) return {};
            
            const pedigree = {
                id: dog.id,
                name: dog.name,
                gender: dog.gender,
                generation: 1,
                sire: dog.sireId ? getPedigree(dog.sireId, generations - 1) : null,
                dam: dog.damId ? getPedigree(dog.damId, generations - 1) : null
            };
            
            return pedigree;
        };
        
        // Función para encontrar ancestros comunes entre dos pedigrees
        const findCommonAncestors = (sirePedigree, damPedigree) => {
            const commonAncestors = [];
            const sireAncestors = flattenPedigree(sirePedigree);
            const damAncestors = flattenPedigree(damPedigree);
            
            // Encontrar IDs comunes
            const sireIds = new Set(sireAncestors.map(a => a.id));
            
            damAncestors.forEach(damAncestor => {
                if (sireIds.has(damAncestor.id)) {
                    const sireAncestor = sireAncestors.find(a => a.id === damAncestor.id);
                    
                    commonAncestors.push({
                        id: damAncestor.id,
                        name: damAncestor.name,
                        sireGen: sireAncestor.generation - 1, // Ajustar generación
                        damGen: damAncestor.generation - 1,   // Ajustar generación
                        contribution: 0 // Se calcula después
                    });
                }
            });
            
            return commonAncestors;
        };
        
        // Función para aplanar un pedigree en un array
        const flattenPedigree = (pedigree, result = [], generation = 1) => {
            if (!pedigree) return result;
            
            result.push({
                id: pedigree.id,
                name: pedigree.name,
                generation: generation
            });
            
            if (pedigree.sire) flattenPedigree(pedigree.sire, result, generation + 1);
            if (pedigree.dam) flattenPedigree(pedigree.dam, result, generation + 1);
            
            return result;
        };
        
        // Función para verificar cuántas generaciones conocidas tiene un perro
        const getKnownGenerations = (dog) => {
            let generations = 0;
            let current = dog;
            
            // Verificar lado paterno
            while (current && current.sireId) {
                const sire = dogs.value.find(d => d.id === current.sireId);
                if (sire) {
                    generations++;
                    current = sire;
                } else {
                    break;
                }
            }
            
            // Reiniciar para verificar lado materno
            current = dog;
            let maternalGens = 0;
            
            while (current && current.damId) {
                const dam = dogs.value.find(d => d.id === current.damId);
                if (dam) {
                    maternalGens++;
                    current = dam;
                } else {
                    break;
                }
            }
            
            // Retornar el máximo entre ambos lados
            return Math.max(generations, maternalGens);
        };
        
        // Función para verificar si dos perros son hermanos completos
        const isSiblings = (dog1, dog2) => {
            return dog1.sireId && dog2.sireId && dog1.damId && dog2.damId && 
                   dog1.sireId === dog2.sireId && dog1.damId === dog2.damId;
        };
        
        // Función para verificar si dos perros son medio hermanos
        const isHalfSiblings = (dog1, dog2) => {
            // Son medio hermanos si comparten padre O madre, pero no ambos
            const sameSire = dog1.sireId && dog2.sireId && dog1.sireId === dog2.sireId;
            const sameDam = dog1.damId && dog2.damId && dog1.damId === dog2.damId;
            return (sameSire || sameDam) && !(sameSire && sameDam);
        };
        
        // Función para calcular la complementariedad fenotípica
        // En una app real, esto evaluaría características físicas, temperamento, etc.
        const calculatePhenotypicComplementarity = (sire, dam) => {
            // Simulamos una evaluación de compatibilidad fenotípica
            // 0 = baja compatibilidad, 1 = alta compatibilidad
            
            // Para demo, generamos un valor aleatorio que favorece cruces que 
            // no son consanguíneos
            const closelyRelated = isSiblings(sire, dam) || isHalfSiblings(sire, dam);
            
            // Base de compatibilidad
            let compatibility = Math.random() * 0.4 + 0.3; // Entre 0.3 y 0.7
            
            // Ajustes por relación cercana (disminuye compatibilidad)
            if (closelyRelated) {
                compatibility *= 0.7; // Reduce 30%
            }
            
            // Ajustes por títulos complementarios (aumenta compatibilidad)
            const sireTitles = new Set(sire.titles || []);
            const damTitles = new Set(dam.titles || []);
            
            // Si tienen títulos complementarios (diferentes), aumenta compatibilidad
            const commonTitles = [...sireTitles].filter(title => damTitles.has(title));
            const uniqueTitles = [...sireTitles, ...damTitles].length - commonTitles.length;
            
            if (uniqueTitles > 2) {
                compatibility += 0.2; // Bonus por diversidad de aptitudes
            }
            
            // Ajuste por líneas sanguíneas (para demo, usamos patrón de nombre)
            const sireOrigin = getOriginFromName(sire.name);
            const damOrigin = getOriginFromName(dam.name);
            
            if (sireOrigin !== damOrigin && sireOrigin && damOrigin) {
                compatibility += 0.15; // Bonus por diversidad de líneas
            }
            
            // Limitar a rango 0-1
            return Math.min(1, Math.max(0, compatibility));
        };
        
        // Función auxiliar para extraer origen de línea basado en nombre
        const getOriginFromName = (name) => {
            // Detectamos patrones comunes en nombres de Malinois
            if (!name) return null;
            
            const nameLower = name.toLowerCase();
            
            if (nameLower.includes('vom') || nameLower.includes('von der') || nameLower.includes('wolfblut')) {
                return 'german';
            } else if (nameLower.includes('van') || nameLower.includes('joefarm') || nameLower.includes('valescas')) {
                return 'dutch';
            } else if (nameLower.includes('du') || nameLower.includes('de la') || nameLower.includes('royaume')) {
                return 'french';
            } else if (nameLower.includes('del') || nameLower.includes('de la')) {
                return 'spanish';
            }
            
            return null;
        };
        
        // Función para obtener clase de color basada en el valor de IC
        const getColorClass = (ic) => {
            if (ic < 0.03) return 'text-green-600';
            if (ic < 0.10) return 'text-amber-500';
            return 'text-red-600';
        };
        
        // Función para obtener clase de color basada en el valor de ALC
        const getAlcColorClass = (alc) => {
            if (alc < 0.15) return 'text-green-600';
            if (alc < 0.30) return 'text-amber-500';
            return 'text-red-600';
        };
        
        // Descripciones para los valores de IC
        const getIcDescription = (ic) => {
            if (ic < 0.03) return 'Bajo. Consanguinidad mínima, excelente para la salud genética.';
            if (ic < 0.10) return 'Moderado. Aceptable, pero monitorear en futuras generaciones.';
            if (ic < 0.20) return 'Alto. Riesgo elevado de problemas genéticos.';
            return 'Muy alto. No recomendado, alto riesgo de defectos genéticos.';
        };
        
        // Descripciones para los valores de ALC
        const getAlcDescription = (alc) => {
            if (alc < 0.15) return 'Excelente diversidad genética.';
            if (alc < 0.30) return 'Diversidad genética aceptable.';
            return 'Baja diversidad genética, riesgo de pérdida de vigor.';
        };
        
        // Función para crear una camada a partir de un análisis
        const createLitter = () => {
            if (!matingAnalysis.value || !matingAnalysis.value.recommended) {
                return;
            }
            
            // Generar identificador de camada
            const litterCount = litters.value.length;
            const nextLetter = String.fromCharCode(65 + (litterCount % 26)); // A, B, C, ...
            const identifier = `${nextLetter} de Casa Vivalco`;
            
            // Crear la nueva camada
            const newLitter = {
                id: 'litter_' + Date.now(),
                identifier,
                birthDate: new Date().toISOString().split('T')[0], // Fecha actual
                sire: {
                    id: selectedSire.value.id,
                    name: selectedSire.value.name
                },
                dam: {
                    id: selectedDam.value.id,
                    name: selectedDam.value.name
                },
                status: 'active',
                ic: matingAnalysis.value.ic,
                alc: matingAnalysis.value.alc,
                puppies: []
            };
            
            litters.value.push(newLitter);
            saveData();
            
            // Cambiar a la sección de camadas
            activeTab.value = 'litters';
            
            // Reset del análisis
            matingAnalysis.value = null;
            selectedSire.value = null;
            selectedDam.value = null;
            matingSearch.value = { sire: '', dam: '' };
            
            // Mostrar notificación
            showToast('Camada creada', `La camada ${identifier} ha sido registrada exitosamente`, 'fas fa-baby text-primary');
        };
        
        // Función para mostrar detalles de una camada
        const showLitterDetails = (litter) => {
            // Enriquecer con información completa de los padres
            const enrichedLitter = { ...litter };
            
            // Obtener información completa del padre
            const sire = dogs.value.find(dog => dog.id === litter.sire.id);
            if (sire) {
                enrichedLitter.sire = { ...sire };
            }
            
            // Obtener información completa de la madre
            const dam = dogs.value.find(dog => dog.id === litter.dam.id);
            if (dam) {
                enrichedLitter.dam = { ...dam };
            }
            
            selectedLitterDetails.value = enrichedLitter;
            showLitterDetailsModal.value = true;
            showAddPuppyForm.value = false;
        };
        
        // Función para añadir un nuevo cachorro a una camada
        const addPuppy = () => {
            if (!selectedLitterDetails.value) return;
            
            const puppyId = 'pup_' + Date.now();
            
            // Crear nuevo cachorro
            const puppyToAdd = {
                id: puppyId,
                ...newPuppy.value
            };
            
            // Añadir a la camada seleccionada
            const litterIndex = litters.value.findIndex(l => l.id === selectedLitterDetails.value.id);
            if (litterIndex !== -1) {
                litters.value[litterIndex].puppies.push(puppyToAdd);
                selectedLitterDetails.value.puppies.push(puppyToAdd);
                saveData();
                
                // Reset form
                newPuppy.value = {
                    name: '',
                    gender: '',
                    status: 'available',
                    description: ''
                };
                
                showAddPuppyForm.value = false;
                
                // Mostrar notificación
                showToast('Cachorro añadido', `${puppyToAdd.name} ha sido añadido a la camada`, 'fas fa-paw text-green-500');
            }
        };
        
        // Función para actualizar el estado de un cachorro
        const updatePuppyStatus = (puppy) => {
            // En una app real, aquí mostraríamos un modal para cambiar el estado
            // Para simplificar, rotamos entre los estados disponibles
            const statusOrder = ['available', 'reserved', 'sold'];
            const currentIndex = statusOrder.indexOf(puppy.status);
            const nextIndex = (currentIndex + 1) % statusOrder.length;
            const newStatus = statusOrder[nextIndex];
            
            // Actualizar el estado
            const litterIndex = litters.value.findIndex(l => l.id === selectedLitterDetails.value.id);
            if (litterIndex !== -1) {
                const puppyIndex = litters.value[litterIndex].puppies.findIndex(p => p.id === puppy.id);
                if (puppyIndex !== -1) {
                    litters.value[litterIndex].puppies[puppyIndex].status = newStatus;
                    puppy.status = newStatus; // Actualizar también en la vista
                    saveData();
                    
                    // Mostrar notificación
                    const statusLabels = {
                        'available': 'Disponible',
                        'reserved': 'Reservado',
                        'sold': 'Vendido'
                    };
                    
                    showToast('Estado actualizado', `${puppy.name} ahora está ${statusLabels[newStatus]}`, 'fas fa-sync text-blue-500');
                }
            }
        };
        
        // Función para verificar si un cachorro puede ser registrado como perro adulto
        const canRegisterAsDog = (puppy) => {
            // Verificar que no esté ya registrado
            return !dogs.value.some(dog => dog.name === puppy.name);
        };
        
        // Función para registrar un cachorro como perro adulto
        const registerPuppyAsDog = (puppy) => {
            if (!selectedLitterDetails.value || !canRegisterAsDog(puppy)) return;
            
            const dogId = 'dog_' + Date.now();
            
            // Crear nuevo perro a partir del cachorro
            const newDogFromPuppy = {
                id: dogId,
                name: puppy.name,
                registrationNumber: '',
                gender: puppy.gender,
                birthDate: selectedLitterDetails.value.birthDate,
                sireId: selectedLitterDetails.value.sire.id,
                damId: selectedLitterDetails.value.dam.id,
                health: [],
                titles: [],
                notes: puppy.description || ''
            };
            
            // Añadir a la lista de perros
            dogs.value.push(newDogFromPuppy);
            
            // Actualizar estado del cachorro a 'sold'
            const litterIndex = litters.value.findIndex(l => l.id === selectedLitterDetails.value.id);
            if (litterIndex !== -1) {
                const puppyIndex = litters.value[litterIndex].puppies.findIndex(p => p.id === puppy.id);
                if (puppyIndex !== -1) {
                    litters.value[litterIndex].puppies[puppyIndex].status = 'sold';
                    puppy.status = 'sold'; // Actualizar también en la vista
                }
            }
            
            saveData();
            
            // Mostrar notificación
            showToast('Perro registrado', `${puppy.name} ha sido registrado como perro adulto`, 'fas fa-dog text-primary');
        };
        
        // Funciones auxiliares
        const calculateAge = (birthDate) => {
            if (!birthDate) return 'Edad desconocida';
            
            const ageInYears = calculateAgeInYears(birthDate);
            const ageInMonths = calculateAgeInMonths(birthDate) % 12;
            
            if (ageInYears < 1) {
                return `${ageInMonths} meses`;
            } else if (ageInMonths === 0) {
                return `${ageInYears} años`;
            } else {
                return `${ageInYears} años, ${ageInMonths} meses`;
            }
        };
        
        const calculateAgeInYears = (birthDate) => {
            if (!birthDate) return 0;
            
            const birth = new Date(birthDate);
            const now = new Date();
            let years = now.getFullYear() - birth.getFullYear();
            
            // Ajustar si todavía no ha pasado el mes y día de nacimiento
            if (now.getMonth() < birth.getMonth() || 
                (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
                years--;
            }
            
            return years;
        };
        
        const calculateAgeInMonths = (birthDate) => {
            if (!birthDate) return 0;
            
            const birth = new Date(birthDate);
            const now = new Date();
            
            return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
        };
        
        const formatDate = (dateString) => {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        
        const isBreeder = (dog) => {
            return litters.value.some(litter => 
                (dog.gender === 'M' && litter.sire.id === dog.id) || 
                (dog.gender === 'F' && litter.dam.id === dog.id)
            );
        };
        
        const countPuppiesByGender = (puppies, gender) => {
            return puppies.filter(puppy => puppy.gender === gender).length;
        };
        
        const countPuppiesByStatus = (puppies, status) => {
            return puppies.filter(puppy => puppy.status === status).length;
        };
        
        const calculatePuppyStatusPercentage = (puppies, status) => {
            if (puppies.length === 0) return 0;
            return (countPuppiesByStatus(puppies, status) / puppies.length) * 100;
        };
        
        const getPuppyStatusClass = (status) => {
            if (status === 'available') return 'bg-green-100 text-green-800';
            if (status === 'reserved') return 'bg-yellow-100 text-yellow-800';
            if (status === 'sold') return 'bg-blue-100 text-blue-800';
            return 'bg-gray-100 text-gray-800';
        };
        
        const getPuppyStatusLabel = (status) => {
            if (status === 'available') return 'Disponible';
            if (status === 'reserved') return 'Reservado';
            if (status === 'sold') return 'Vendido';
            return status;
        };
        
        // Función para mostrar notificaciones toast
        const showToast = (title, message, icon) => {
            toastTitle.value = title;
            toastMessage.value = message;
            toastIcon.value = icon;
            
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        };
        
        return {
            // Navegación
            activeTab,
            tabs,
            
            // Datos y estadísticas
            dogs,
            litters,
            stats,
            dashboardStats,
            genderDistribution,
            topBreeders,
            
            // Gestión de perros
            dogFilters,
            filteredDogs,
            showAddDogModal,
            newDog,
            maleDogs,
            femaleDogs,
            healthConditions,
            availableTitles,
            showDogDetails,
            addNewDog,
            showDogDetailsModal,
            selectedDogDetails,
            pedigreeLoaded,
            
            // Análisis de cruza
            matingSearch,
            sireSearchResults,
            damSearchResults,
            selectedSire,
            selectedDam,
            matingAnalysis,
            searchSires,
            searchDams,
            selectSire,
            selectDam,
            analyzeMatching,
            getColorClass,
            getAlcColorClass,
            getIcDescription,
            getAlcDescription,
            createLitter,
            
            // Gestión de camadas
            litterFilters,
            availableYears,
            filteredLitters,
            showLitterDetails,
            showLitterDetailsModal,
            selectedLitterDetails,
            showAddPuppyForm,
            newPuppy,
            addPuppy,
            updatePuppyStatus,
            canRegisterAsDog,
            registerPuppyAsDog,
            
            // Funciones auxiliares
            calculateAge,
            formatDate,
            isBreeder,
            countPuppiesByGender,
            countPuppiesByStatus,
            calculatePuppyStatusPercentage,
            getPuppyStatusClass,
            getPuppyStatusLabel,
            
            // Notificaciones
            toastTitle,
            toastMessage,
            toastIcon
        };
    }
});

// Montar la aplicación
app.mount('#app');