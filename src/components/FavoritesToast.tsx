import { useEffect } from 'react'
import { clearFavoritesError, useFavoritesSnapshot } from '../lib/favorites'

/** Kurzer Hinweis, wenn Merken/Besucht nicht gespeichert werden konnte. */
export default function FavoritesToast() {
  const { error } = useFavoritesSnapshot()
  useEffect(() => {
    if (!error) return
    const id = setTimeout(clearFavoritesError, 6000)
    return () => clearTimeout(id)
  }, [error])
  if (!error) return null
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-[1500] p-4" role="alert">
      <button type="button" onClick={clearFavoritesError} className="mx-auto block w-full max-w-xl rounded-2xl bg-rose-600 p-4 text-left text-white shadow-lg">
        {error}
      </button>
    </div>
  )
}
