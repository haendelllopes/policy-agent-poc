#!/usr/bin/env node

/**
 * Script de Validação do Brand Manual Navi
 * Testa se todas as páginas estão usando o Brand Manual corretamente
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 VALIDAÇÃO DO BRAND MANUAL NAVI');
console.log('=====================================\n');

// Lista de páginas para validar
const pages = [
    'dashboard.html',
    'landing.html',
    'funcionarios.html',
    'admin-trilhas.html',
    'documentos.html',
    'configurador.html',
    'configurador-cargos.html',
    'configurador-categorias.html',
    'configurador-departamentos.html',
    'colaborador-trilhas.html',
    'colaborador-quiz.html',
    'colaborador-ranking.html',
    'colaborador-trilha-detalhes.html',
    'inicio.html'
];

// Elementos do Brand Manual para verificar
const brandElements = {
    'Google Fonts': {
        patterns: [
            /Montserrat.*Roboto/,
            /fonts\.googleapis\.com.*Montserrat/,
            /fonts\.googleapis\.com.*Roboto/
        ],
        description: 'Fontes Montserrat e Roboto importadas'
    },
    'Favicon': {
        patterns: [
            /favicon.*svg/,
            /fill='%2317A2B8'/,
            /Navigator.*svg/
        ],
        description: 'Favicon NAVI atualizado'
    },
    'Brand Colors': {
        patterns: [
            /--navi-primary-dark.*#343A40/,
            /--navi-accent-teal.*#17A2B8/,
            /--navi-secondary-grey.*#6C7570/,
            /--navi-success-green.*#28A745/
        ],
        description: 'Variáveis CSS do Brand Manual'
    },
    'Typography': {
        patterns: [
            /font-family.*Montserrat/,
            /font-family.*Roboto/,
            /h1.*Montserrat/,
            /h2.*Montserrat/,
            /body.*Roboto/
        ],
        description: 'Tipografia Montserrat + Roboto aplicada'
    },
    'Logo NAVI': {
        patterns: [
            /logo-navi/,
            /NAV.*I/,
            /stroke.*#17A2B8/,
            /Navigator/
        ],
        description: 'Logo NAVI implementado'
    }
};

let totalPages = pages.length;
let validatedPages = 0;
let totalElements = 0;
let validatedElements = 0;

console.log(`📋 Validando ${totalPages} páginas...\n`);

// Validar cada página
pages.forEach(page => {
    const filePath = path.join(__dirname, 'public', page);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${page} - Arquivo não encontrado`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let pageValidated = true;
    let pageElements = 0;
    let pageValidatedElements = 0;
    
    console.log(`📄 ${page}:`);
    
    // Verificar cada elemento do Brand Manual
    Object.entries(brandElements).forEach(([elementName, config]) => {
        pageElements++;
        totalElements++;
        
        const hasElement = config.patterns.some(pattern => pattern.test(content));
        
        if (hasElement) {
            console.log(`  ✅ ${elementName}`);
            pageValidatedElements++;
            validatedElements++;
        } else {
            console.log(`  ❌ ${elementName}`);
            pageValidated = false;
        }
    });
    
    if (pageValidated) {
        console.log(`  🎉 ${page} - 100% validada\n`);
        validatedPages++;
    } else {
        console.log(`  ⚠️  ${page} - ${pageValidatedElements}/${pageElements} elementos\n`);
    }
});

// Resumo final
console.log('📊 RESUMO DA VALIDAÇÃO:');
console.log('========================');
console.log(`📄 Páginas: ${validatedPages}/${totalPages} (${Math.round(validatedPages/totalPages*100)}%)`);
console.log(`🎨 Elementos: ${validatedElements}/${totalElements} (${Math.round(validatedElements/totalElements*100)}%)`);

if (validatedPages === totalPages && validatedElements === totalElements) {
    console.log('\n🎉 SUCESSO! Brand Manual 100% implementado!');
    console.log('✅ Pronto para commit');
} else if (validatedPages >= totalPages * 0.9) {
    console.log('\n⚠️  Brand Manual quase completo!');
    console.log('🔧 Pequenos ajustes necessários');
} else {
    console.log('\n❌ Brand Manual precisa de mais trabalho');
    console.log('🚧 Implementação incompleta');
}

console.log('\n🌐 Para testar visualmente:');
console.log('   http://localhost:3000/dashboard.html');
console.log('   http://localhost:3000/landing.html');
console.log('   http://localhost:3000/funcionarios.html');
