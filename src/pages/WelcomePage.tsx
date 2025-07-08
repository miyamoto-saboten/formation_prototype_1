// src/pages/WelcomePage.tsx
import { useCallback } from 'react';
import type { ChangeEvent, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WelcomePage.module.css';

/** --- 型定義（最小） --- */
interface ProjectFile {
  meta: { appVersion: string };
  stage: unknown;
  dancers?: unknown;
  formations: unknown;
  transitions?: unknown;
}

/** --- 画面コンポーネント --- */
const WelcomePage: FC = () => {
  const navigate = useNavigate();

  /** 「新しく始める」 */
  const handleNewProject = () => {
    navigate('/editor');
  };

  /** JSON 読み込み */
  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      /* 拡張子チェック */
      if (!file.name.toLowerCase().endsWith('.json')) {
        alert('JSON ファイルを選択してください。');
        e.target.value = '';
        return;
      }

      try {
        const text = await file.text();
        const data: ProjectFile = JSON.parse(text);

        /* 必須キーの簡易検証 */
        if (!data.meta?.appVersion || !data.stage || !data.formations) {
          throw new Error('プロジェクト構造が不正です');
        }

        /* エディタへ遷移（state でデータを渡す例） */
        navigate('/editor', { state: { project: data } });
      } catch (err) {
        console.error(err);
        alert('プロジェクトファイルの読み込みに失敗しました。');
        e.target.value = '';
      }
    },
    [navigate],
  );

  return (
  <div className={styles.root}>
    <h1>Formation Editor</h1>

    <button type="button" onClick={handleNewProject} className={styles.newButton}>
      New&nbsp;Project
    </button>

    <label className={styles.uploadLabel}>
      Load&nbsp;Project&nbsp;(.json)
      <input type="file" accept=".json,application/json" onChange={handleFileChange} style={{ display: 'none' }} />
    </label>
  </div>
  );
};

export default WelcomePage;
