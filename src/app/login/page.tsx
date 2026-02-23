'use client'

import { useActionState } from 'react'
import { login } from './actions'
import styles from './login.module.css'

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | null, formData: FormData) => {
            return await login(formData)
        },
        null
    )

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>山田園芸</h1>
                    <p className={styles.subtitle}>作業マニュアルDB</p>
                </div>

                <form action={formAction} className={styles.form}>
                    {state?.error && (
                        <div className={styles.error}>
                            {state.error}
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="workerName" className={styles.label}>
                            お名前
                        </label>
                        <input
                            id="workerName"
                            name="workerName"
                            type="text"
                            required
                            className={styles.input}
                            placeholder="山田 太郎"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            パスワード
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={styles.input}
                            placeholder="パスワードを入力"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={isPending}
                    >
                        {isPending ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    )
}
