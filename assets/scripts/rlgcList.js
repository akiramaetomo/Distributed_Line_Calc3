// rlgcList.js 24-1013

// RLGC一覧のテーブルとステータスメッセージを取得
const rlgcTableBody = document.querySelector('#rlgcTable tbody');
const statusElement = document.getElementById('status');

// 親ウインドウのRLGCManagerが存在するか確認
if (!window.opener || !window.opener.RLGCManager) {
    alert('親ウインドウのRLGCManagerが見つかりません。');
    window.close();
}

// RLGCセットを表示する関数
const displayRLGCSets = () => {
    const sets = window.opener.RLGCManager.loadSets();
    rlgcTableBody.innerHTML = ''; // 既存の行をクリア

    if (sets.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'RLGCセットがありません。';
        row.appendChild(cell);
        rlgcTableBody.appendChild(row);
        return;
    }

    sets.forEach((set, index) => {
        const row = document.createElement('tr');

        // 定数名
        const nameCell = document.createElement('td');
        nameCell.textContent = set.name;
        row.appendChild(nameCell);

        // R
        const rCell = document.createElement('td');
        rCell.textContent = set.r;
        row.appendChild(rCell);

        // L
        const lCell = document.createElement('td');
        lCell.textContent = set.l;
        row.appendChild(lCell);

        // G
        const gCell = document.createElement('td');
        gCell.textContent = set.g;
        row.appendChild(gCell);

        // C
        const cCell = document.createElement('td');
        cCell.textContent = set.c;
        row.appendChild(cCell);

        // 削除ボタン
        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => handleDelete(index));
        deleteCell.appendChild(deleteBtn);
        row.appendChild(deleteCell);

        rlgcTableBody.appendChild(row);
    });
};

// 削除処理を行う関数
const handleDelete = (index) => {
    statusElement.innerText = '削除処理を開始しています...';

    const confirmDelete = confirm(`RLGCセットを削除してもよろしいですか？`);
    if (!confirmDelete) return;
    
    try {
        // 親ウインドウのdeleteRlgcSet関数が存在するか確認
        if (typeof window.opener.RLGCManager.deleteRlgcSet !== 'function') {
            throw new Error('親ウインドウのdeleteRlgcSet関数が見つかりません。');
        }

        // ログの追加
        const existingLog = JSON.parse(localStorage.getItem('debugLog')) || [];
        existingLog.push(`handleDelete(${index}) が呼ばれました。`);
        localStorage.setItem('debugLog', JSON.stringify(existingLog));

        // 削除処理の実行
//        window.opener.RLGCManager.deleteRlgcSet(index);
        // 削除処理の実行（確認ダイアログをスキップ）
        window.opener.RLGCManager.deleteSet(index, true);

        // 成功メッセージの表示とログの更新
        statusElement.innerText += '\n削除が成功しました。';
        existingLog.push('削除が成功しました。');
        localStorage.setItem('debugLog', JSON.stringify(existingLog));

        // RLGCセットの再表示
        displayRLGCSets();
    } catch (error) {
        console.error('削除中にエラーが発生しました:', error);
        alert('削除に失敗しました。コンソールを確認してください。');
        statusElement.innerText += '\n削除に失敗しました。エラーを確認してください。';

        const existingLog = JSON.parse(localStorage.getItem('debugLog')) || [];
        existingLog.push(`エラー発生: ${error.message}`);
        localStorage.setItem('debugLog', JSON.stringify(existingLog));
    }
};

// ページ読み込み時にRLGCセットを表示
window.onload = () => {
    displayRLGCSets();
};
