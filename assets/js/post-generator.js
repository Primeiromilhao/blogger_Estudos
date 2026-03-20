/**
 * Post Generator Logic for Nova Jerusalém - REFINED VERSION
 * Deep connection between: Book + Bible + Daily Life + Mental Map
 */

const postsLibrary = [
    {
        // Slot 1: 00:00 - 04:00 (Night - Spiritual Authority)
        id: 1,
        bookTitle: "Uma Caminhada Com Os Anjos",
        bookCover: "https://m.media-amazon.com/images/I/61Xn2OS9TAL._SY425_.jpg",
        amazonLink: "https://www.amazon.com.br/Uma-Caminhada-Com-OS-Anjos/dp/1546821759/",
        siteLink: "https://novajerusalem.netlify.app/",
        teaching: "Muitas vezes o cansaço e a sensação de solidão na madrugada são ataques espirituais. Deus usa anjos para renovar sua força enquanto você descansa.",
        bibleVerses: ["Salmos 34:7", "Mateus 18:10", "Hebreus 1:14"],
        mapData: {
            center: "Conexão de Proteção",
            branches: [
                { label: "Anjos Guardiões", ref: "Sl 34:7" },
                { label: "Socorro Presente", ref: "Hb 1:14" },
                { label: "Fé no Invisível", ref: "Vida Diária" }
            ]
        },
        caption: "A sensação de estar sozinho é apenas uma ilusão. 😇 No livro 'Uma Caminhada Com Os Anjos', Henry Otasowere ensina que o exército de Deus acampa ao seu redor (Salmos 34:7). \n\n🔥 Quando você dorme, os anjos trabalham na sua proteção. Não tema a noite! \n\n📖 Aprenda a ativar esse ministério: https://amzn.to/4tFDApL \n#Anjos #ProteçãoDivina #HenryOtasowere #Bíblia"
    },
    {
        // Slot 2: 04:00 - 08:00 (Morning - Financial/Purpose Altar)
        id: 2,
        bookTitle: "O Poder de Um Altar",
        bookCover: "https://m.media-amazon.com/images/I/61KGKLCUt2L._SY425_.jpg",
        amazonLink: "https://amzn.to/4sfRw90",
        siteLink: "https://novajerusalem.netlify.app/",
        teaching: "Seus projetos financeiros e familiares precisam de um fundamento. O Altar não é apenas religioso, é onde você estabelece o domínio de Deus sobre o seu sustento.",
        bibleVerses: ["Gênesis 22:9", "Levítico 6:13", "Êxodo 20:24"],
        mapData: {
            center: "Altar da Vitória",
            branches: [
                { label: "Fogo Contínuo", ref: "Lv 6:13" },
                { label: "Entrega Total", ref: "Gn 22:9" },
                { label: "Promessa", ref: "Estratégia" }
            ]
        },
        caption: "O que sustenta a sua vitória hoje não é a força do seu braço, mas a firmeza do seu altar! 🔥 No livro 'O Poder de Um Altar', você descobrirá que o altar é o segredo para transformar crises financeiras em testemunhos de abundância. \n\n📍 Comece seu dia estabelecendo um altar de gratidão e obediência. \n\n📖 Disponível aqui: https://amzn.to/4sfRw90 \n#ProsperidadeBíblica #Altar #Fé #HenryOtasowere"
    },
    {
        // Slot 3: 08:00 - 12:00 (Day - Completion/Anxiety)
        id: 3,
        bookTitle: "Deus Terminar o Que Ele Começou",
        bookCover: "https://m.media-amazon.com/images/I/61QygmV9kdL._SY425_.jpg",
        amazonLink: "https://amzn.to/4svuqvj",
        siteLink: "https://novajerusalem.netlify.app/",
        teaching: "A ansiedade pelo futuro acontece quando esquecemos Quem detém o cronograma. Se Deus deu a visão, Ele proverá a conclusão.",
        bibleVerses: ["Filipenses 1:6", "Isaías 46:10", "1 Tessalonicenses 5:24"],
        mapData: {
            center: "Conclusão de Projetos",
            branches: [
                { label: "Sem Ansiedade", ref: "Fp 1:6" },
                { label: "Fim Revelado", ref: "Is 46:10" },
                { label: "Fidelidade", ref: "Selo de Deus" }
            ]
        },
        caption: "Deus não é autor de obras inacabadas. ✨ Se a sua vida parece um 'canteiro de obras' parado, lembre-se: Aquele que começou a boa obra é fiel para completá-la (Fp 1:6). \n\n📚 O livro 'Deus Terminar o Que Ele Começou' é o guia para quem precisa de perseverança no dia a dia. \n\n📖 Adquira na Amazon: https://amzn.to/4svuqvj \n#Perseverança #DeusFiel #Vitória #Cristianismo"
    },
    {
        // Slot 4: 12:00 - 16:00 (Afternoon - Spiritual Warfare/Secrets)
        id: 4,
        bookTitle: "Espíritos Marinhos",
        bookCover: "https://novajerusalem.netlify.app/assets/img/og-image.jpg", // Placeholder for actual cover if available
        amazonLink: "https://novajerusalem.netlify.app/nova-jerusalem/estudo_espiritos.html",
        siteLink: "https://novajerusalem.netlify.app/nova-jerusalem/estudo_espiritos.html",
        teaching: "Existem correntes invisíveis que prendem o progresso familiar. Conhecer a origem dessas opressões em Gênesis 6 é o primeiro passo para a quebra de maldições.",
        bibleVerses: ["Gênesis 6:1-5", "Judas 1:6", "Efésios 6:11-12"],
        mapData: {
            center: "O Mistério de Gênesis 6",
            branches: [
                { label: "Identidade", ref: "Gn 6" },
                { label: "Raízes Marinhas", ref: "Mistério" },
                { label: "O Sangue de Jesus", ref: "Cura" }
            ]
        },
        caption: "Você sente que certas áreas da sua vida estão 'bloqueadas'? 🌊 O estudo sobre Espíritos Marinhos revela os mistérios de Gênesis 6 e como as antigas correntes de opressão podem ser quebradas hoje. \n\n📖 Saiba como lutar e vencer: https://novajerusalem.netlify.app/ \n#BatalhaEspiritual #Libertação #MistériosBíblicos #Gênesis6"
    },
    {
        // Slot 5: 16:00 - 20:00 (Evening - Courage/Fear)
        id: 5,
        bookTitle: "O Homem de Fé",
        bookCover: "https://m.media-amazon.com/images/I/71hGi0x6z6L._SY425_.jpg",
        amazonLink: "https://amzn.to/4lPajFT",
        siteLink: "https://novajerusalem.netlify.app/",
        teaching: "O medo é a fé no lugar errado. Ser um homem ou mulher de fé significa agir apesar das circunstâncias difíceis do trabalho ou da saúde.",
        bibleVerses: ["Hebreus 11:1", "Josué 1:9", "Marcos 9:23"],
        mapData: {
            center: "Inabalável no Dia a Dia",
            branches: [
                { label: "Coragem Real", ref: "Josué 1:9" },
                { label: "Visão do Futuro", ref: "Hb 11:1" },
                { label: "Tudo é Possível", ref: "Mc 9:23" }
            ]
        },
        caption: "Fé não é ausência de medo, é confiança absoluta em meio à tempestade. ⚔️ No livro 'O Homem de Fé', você aprenderá que a coragem de Abraão e Caleb está disponível para você hoje! \n\n📖 Fortaleça seu homem interior: https://amzn.to/4lPajFT \n#Coragem #FéInabalável #HenryOtasowere #DesafioDiário"
    },
    {
        // Slot 6: 20:00 - 00:00 (Night - Salvation/New Beginnings)
        id: 6,
        bookTitle: "Salvação, um novo nascimento",
        bookCover: "https://m.media-amazon.com/images/I/41w8FUOEwgL._SY445_SX342_ML2_.jpg",
        amazonLink: "https://www.amazon.com.br/Salva%C3%A7%C3%A3o-um-novo-nascimento-Portuguese/dp/1453808833/",
        siteLink: "https://novajerusalem.netlify.app/",
        teaching: "Não importa como foi o seu dia. Em Cristo, cada anoitecer é uma chance de renovar o altar e experimentar o novo nascimento em áreas que morreram.",
        bibleVerses: ["João 3:3-7", "2 Coríntios 5:17", "Lamentações 3:22-23"],
        mapData: {
            center: "Novo Começo Hoje",
            branches: [
                { label: "Renovação", ref: "Lam 3:22" },
                { label: "Identidade", ref: "2 Co 5:17" },
                { label: "Céu Aberto", ref: "João 3" }
            ]
        },
        caption: "A salvação não é apenas para o futuro, é para o seu presente. ✨ Entenda o segredo do Novo Nascimento para destravar novas dimensões na sua vida familiar e espiritual. \n\n📖 Descubra seu propósito real: https://amzn.to/3XxxYYY \n#Salvação #NovoNascimento #Esperança #JesusCristo"
    }
];

function getCurrentSlot() {
    const hours = new Date().getHours();
    return Math.floor(hours / 4); // 0-5 slots
}

function getDailyPost() {
    const slot = getCurrentSlot();
    return postsLibrary[slot];
}

window.PostGenerator = {
    getDailyPost,
    postsLibrary
};
