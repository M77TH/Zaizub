'use client'

import { useActionState } from 'react'
import { updateProfile, type AuthActionState } from '@/app/actions/auth'

const initialState: AuthActionState = null

export default function ProfileForm({
  displayName,
}: {
  displayName: string
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  )

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          ชื่อที่แสดง
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          required
          maxLength={80}
          className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
      </div>

      {state?.error && (
        <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          {state.error}
        </div>
      )}

      {state?.success && state.message && (
        <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`px-5 py-3 rounded-xl text-white font-semibold transition-all ${
          pending
            ? 'bg-purple-600/50 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-500'
        }`}
      >
        {pending ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
      </button>
    </form>
  )
}
