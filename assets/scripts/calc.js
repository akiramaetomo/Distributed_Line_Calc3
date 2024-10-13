// calc.js
// 最終更新日: 2024/10/13

console.log('RLGC calc start...');  // デバッグ用

// ローカルストレージのデバッグログをクリア
localStorage.removeItem('debugLog');

// 定数の定義
const SELECTORS = {
    rlgcSelect: 'rlgc-select',
    openRlgcListBtn: 'open-rlgc-list',
    rlgcForm: 'rlgc-form',
    rlgcNameInput: 'rlgc-name',
    rlgcRInput: 'rlgc-r',
    rlgcLInput: 'rlgc-l',
    rlgcGInput: 'rlgc-g',
    rlgcCInput: 'rlgc-c',
    rlgcIdInput: 'rlgc-id',
    saveRlgcBtn: 'save-rlgc',
    clearRlgcBtn: 'clear-rlgc',
    frequencyInput: 'frequency',
    lineLengthInput: 'line-length',
    loadMagnitudeInput: 'load-magnitude',
    loadPhaseInput: 'load-phase',
    autoscaleCheckbox: 'autoscale-checkbox',
    maxImpedanceInput: 'max-impedance',
    errorMessage: 'error-message',
    impedanceChart: 'impedanceChart',
    z0Polar: 'z0_polar',
    z0Complex: 'z0_complex',
    attenuation: 'attenuation',
    beta: 'beta',
    zinPolar: 'zin_polar',
    zinComplex: 'zin_complex'
};

const MAX_RLGC_SETS = 20;

// DOM要素の取得
const elements = {};
Object.keys(SELECTORS).forEach(key => {
    elements[key] = document.getElementById(SELECTORS[key]);
});

// RLGC入力要素の配列
const rlgcInputs = [elements.rlgcRInput, elements.rlgcLInput, elements.rlgcGInput, elements.rlgcCInput];
const mainFormInputs = [elements.frequencyInput, elements.lineLengthInput, elements.loadMagnitudeInput, elements.loadPhaseInput];

// Chart.js の初期化
Chart.defaults.font.size = 14;
Chart.defaults.font.weight = 'bold';

const ctx = elements.impedanceChart.getContext('2d');
let impedanceChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Input Impedance Magnitude (Ω)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false
        }]
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: 'Line Length (km)' },
                ticks: {
                    callback: value => parseFloat(value).toFixed(2),
                    beginAtZero: true
                }
            },
            y: {
                title: { display: true, text: '|Zin|(Ω)' },
                beginAtZero: true,
                ticks: {
                    callback: value => value.toLocaleString()
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: context => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        label += `|Zin| = ${context.parsed.y.toFixed(3)} Ω`;
                        return label;
                    }
                }
            }
        }
    }
});

// デバイスの管理関数
const RLGCManager = {
    loadSets() {
        return JSON.parse(localStorage.getItem('rlgcSets')) || [];
    },
    saveSets(sets) {
        localStorage.setItem('rlgcSets', JSON.stringify(sets));
    },
    addDefaultSet() {
        const defaultSet = { name: 'Default', r: 31.5, l: 0.605e-3, g: 4.35E-5, c: 0.0488e-6 };
        let sets = this.loadSets();
        sets.push(defaultSet);
        this.saveSets(sets);
        UI.populateRlgcSelect();
        alert('デフォルトのデバイスを追加しました。');
    },
    
    deleteSet(index, skipConfirm = false) {
        let sets = this.loadSets();
        if (index < 0 || index >= sets.length) {
            alert('削除するRLGCセットが見つかりません。');
            return;
        }
    
        if (!skipConfirm) {
            const confirmDelete = confirm(`RLGCセット「${sets[index].name}」を削除してもよろしいですか？`);
            if (!confirmDelete) return;
        }
    
        sets.splice(index, 1);
        this.saveSets(sets);
        UI.populateRlgcSelect();
    
        if (sets.length > 0) {
            elements.rlgcSelect.value = index === 0 ? 0 : index - 1;
            this.applySelectedSet();
        } else {
            this.addDefaultSet();
        }
        alert('RLGCセットが削除されました。');
    },

    applySelectedSet() {
        const sets = this.loadSets();
        const selectedIndex = parseInt(elements.rlgcSelect.value);
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= sets.length) {
            alert('選択されたデバイスが無効です。');
            return;
        }
        const selectedSet = sets[selectedIndex];
        elements.rlgcNameInput.value = selectedSet.name;
        elements.rlgcRInput.value = selectedSet.r;
        elements.rlgcLInput.value = selectedSet.l;
        elements.rlgcGInput.value = selectedSet.g;
        elements.rlgcCInput.value = selectedSet.c;
        Calculator.calculateAndUpdateGraph();
    },
    deleteRlgcSet(index) {
        this.deleteSet(index);
    }
};

// RLGCManagerをグローバルオブジェクトとして公開
window.RLGCManager = RLGCManager;

// UI関連の関数
const UI = {
    populateRlgcSelect() {
        const sets = RLGCManager.loadSets();
        elements.rlgcSelect.innerHTML = '';
        sets.forEach((set, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = set.name;
            elements.rlgcSelect.appendChild(option);
        });
        if (sets.length > 0) {
            elements.rlgcSelect.value = 0;
            RLGCManager.applySelectedSet();
        } else {
            RLGCManager.addDefaultSet();
        }
    },
    openRlgcList() {
        const sets = RLGCManager.loadSets();
        const windowFeatures = "width=700,height=500,scrollbars=yes";


//        const rlgcWindow = window.open("", "RLGC List", windowFeatures);
        // 子画面用のHTMLファイルを開く
        const rlgcWindow = window.open("rlgcList.html", "RLGC List", windowFeatures);

        if (!rlgcWindow) {
            alert('ポップアップがブロックされています。ポップアップを許可してください。');
            return;
        }

        // 子画面が完全にロードされるまで待つ（オプション）
        rlgcWindow.addEventListener('load', () => {
            console.log('子画面がロードされました。');
        });


        // 基本HTML構造の作成 　　以降、rlgcList.html .js として別ファイル化　24-1013　

    }
};

// 計算およびグラフ更新のための関数
const Calculator = {
    calculateAndUpdateGraph() {
        console.log('Calculating graph...');  // デバッグ用

        const frequency = parseFloat(elements.frequencyInput.value) || 0;
        const sets = RLGCManager.loadSets();
        const selectedIndex = parseInt(elements.rlgcSelect.value);
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= sets.length) {
            alert('選択されたデバイス名は無効です。');
            return;
        }
        const selectedSet = sets[selectedIndex];
        const R = parseFloat(elements.rlgcRInput.value) || selectedSet.r;
        const L = parseFloat(elements.rlgcLInput.value) || selectedSet.l;
        const G = parseFloat(elements.rlgcGInput.value) || selectedSet.g;
        const C = parseFloat(elements.rlgcCInput.value) || selectedSet.c;
        
        let lineLength = parseFloat(elements.lineLengthInput.value) || 0;
        const loadMagnitude = parseFloat(elements.loadMagnitudeInput.value) || 0;
        const loadPhase = parseFloat(elements.loadPhaseInput.value) || 0;

        const omega = 2 * Math.PI * frequency;
        const j = math.complex(0, 1);

        const Z = math.complex(R, omega * L);
        const Y = math.complex(G, omega * C);
        const Z0 = math.sqrt(math.divide(Z, Y));
        const gamma = math.sqrt(math.multiply(Z, Y));

        const loadImpedance = math.complex(
            loadMagnitude * Math.cos(loadPhase * Math.PI / 180), 
            loadMagnitude * Math.sin(loadPhase * Math.PI / 180)
        );

        // Z₀の表示
        const Z0Magnitude = math.abs(Z0).toFixed(3);
        const Z0Phase = (math.arg(Z0) * 180 / Math.PI).toFixed(3);
        elements.z0Polar.innerText = `${Z0Magnitude} ∠ ${Z0Phase}° Ω`;
        elements.z0Complex.innerText = `${math.re(Z0).toFixed(3)} + ${math.im(Z0).toFixed(3)}i Ω`;

        // 減衰定数 (α) の表示
        const alpha_np = math.re(gamma);
        const alpha_db = (alpha_np * 8.686).toFixed(3); // 1 Np ≈ 8.686 dB
        elements.attenuation.innerText = `${alpha_db} dB/km`;

        // 位相定数 (β) の表示
        const beta_rad = math.im(gamma);
        const beta_deg = (beta_rad * 180 / Math.PI).toFixed(3);
        elements.beta.innerText = `${beta_deg}`;

        let lengths = [];
        let magnitudes = [];

        // 線路長がゼロの場合の対策
        if (lineLength === 0) {
            lineLength = 1e-50;
        }

        const numberOfPoints = 100;
        const step = lineLength / numberOfPoints;

        for (let i = 0; i <= numberOfPoints; i++) {
            let length = i * step;
            // Zinの計算
            const Zin = math.multiply(Z0, math.divide(
                math.add(loadImpedance, math.multiply(Z0, math.tanh(math.multiply(gamma, length)))),
                math.add(Z0, math.multiply(loadImpedance, math.tanh(math.multiply(gamma, length))))
            ));
            lengths.push(length);
            magnitudes.push(math.abs(Zin));

            // 最後の長さでのZinの表示
            if (i === numberOfPoints) {
                const ZinMagnitude = math.abs(Zin).toFixed(3);
                const ZinPhase = (math.arg(Zin) * 180 / Math.PI).toFixed(3);
                const ZinRe = math.re(Zin).toFixed(3);
                const ZinIm = math.im(Zin).toFixed(3);
                elements.zinPolar.innerText = `${ZinMagnitude} ∠ ${ZinPhase}° Ω`;
                elements.zinComplex.innerText = `${ZinRe} + ${ZinIm}i Ω`;
            }
        }

        // 最大インピーダンスの設定とオートスケール
        const maxImpedanceValue = parseFloat(elements.maxImpedanceInput.value);
        let maxImpedance;
        if (maxImpedanceValue <= 0 || isNaN(maxImpedanceValue)) {
            maxImpedance = 1e-50; // 強制的に1e-50に設定
            elements.errorMessage.style.display = 'block';
        } else {
            maxImpedance = maxImpedanceValue;
            elements.errorMessage.style.display = 'none';
        }

        impedanceChart.options.scales.y.max = elements.autoscaleCheckbox.checked ? null : maxImpedance;
        impedanceChart.options.scales.x.min = 0;
        impedanceChart.options.scales.x.max = lineLength;

        // データポイントの作成
        let dataPoints = lengths.map((length, index) => ({ x: length, y: magnitudes[index] }));
        impedanceChart.data.datasets[0].data = dataPoints;
        impedanceChart.update();
    }
};

// イベントリスナーの設定
const setupEventListeners = () => {
    // RLGC入力の即時反映
    rlgcInputs.forEach(input => {
        input.addEventListener('input', () => {
            console.log('Input changed:', input.id, 'New value:', input.value);  // デバッグ用
            Calculator.calculateAndUpdateGraph();
        });
    });

    // RLGC選択変更時の即時反映
    elements.rlgcSelect.addEventListener('change', RLGCManager.applySelectedSet.bind(RLGCManager));

    // RLGCリストを開くボタン
    elements.openRlgcListBtn.addEventListener('click', UI.openRlgcList);

    // 保存ボタンの動作
    elements.saveRlgcBtn.addEventListener('click', () => {
        const name = elements.rlgcNameInput.value.trim();
        const r = parseFloat(elements.rlgcRInput.value);
        const l = parseFloat(elements.rlgcLInput.value);
        const g = parseFloat(elements.rlgcGInput.value);
        const c = parseFloat(elements.rlgcCInput.value);

        if (!name) {
            alert('定数名を入力してください。');
            return;
        }

        let sets = RLGCManager.loadSets();
        let existingSetIndex = sets.findIndex(set => set.name === name);

        if (existingSetIndex !== -1) {
            const overwrite = confirm(`デバイス「${name}」は既に存在します。上書きしますか？`);
            if (!overwrite) return;
            sets[existingSetIndex] = { name, r, l, g, c };
        } else {
            sets.push({ name, r, l, g, c });
        }

        RLGCManager.saveSets(sets);
        UI.populateRlgcSelect();
        elements.rlgcSelect.value = sets.length - 1;
        RLGCManager.applySelectedSet();
        alert('デバイスが保存されました。');
    });

    // クリア（削除）ボタンの動作
    elements.clearRlgcBtn.addEventListener('click', () => {
        const selectedIndex = parseInt(elements.rlgcSelect.value);
        if (isNaN(selectedIndex)) {
            alert('削除するデバイスが選択されていません。');
            return;
        }
        RLGCManager.deleteRlgcSet(selectedIndex);
    });

    // メインフォームの入力変更時のグラフ更新
    mainFormInputs.forEach(input => {
        input.addEventListener('input', Calculator.calculateAndUpdateGraph);
        input.addEventListener('change', Calculator.calculateAndUpdateGraph);
    });

    // **追加部分: Autoscaleチェックボックスの変更イベント**
    elements.autoscaleCheckbox.addEventListener('change', () => {
        const isChecked = elements.autoscaleCheckbox.checked;
        elements.maxImpedanceInput.disabled = isChecked; // チェックされていれば無効にする
        Calculator.calculateAndUpdateGraph(); // グラフの再計算・更新
    });
    
};

// 初期化処理
const init = () => {
    setupEventListeners();
    UI.populateRlgcSelect();
    Calculator.calculateAndUpdateGraph();
};

// DOMが完全に読み込まれた後に初期化
document.addEventListener('DOMContentLoaded', init);

// グローバルにdeleteRlgcSetを公開
window.deleteRlgcSet = index => RLGCManager.deleteRlgcSet(index);
