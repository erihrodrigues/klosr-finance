import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../firebase/auth'
import { getLojas, addLoja, updateLoja, deleteLoja } from '../firebase/db'

export default function Dashboard() {
  const { user, perfil } = useAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [lojas, setLojas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [novaLoja, setNovaLoja] = useState({ nome: '', icon: '🏢', imagem: null })
  const fileRef = useRef()

  const isSuperAdmin = perfil?.cargo === 'superadmin'
  const isAdmin = perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin'
  const isModerador = perfil?.cargo === 'moderador'

  const icons = ['🏢', '🌾', '🍦', '🛒', '☕', '🏪', '🍽️', '💈', '🏭', '🛍️']

  useEffect(() => { 
    if (perfil !== undefined) carregarLojas() 
  }, [perfil])

  async function carregarLojas() {
    setLoading(true)
    try {
      const lojasPermitidas = (perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin') ? null : perfil?.lojas
      const data = await getLojas(user.uid, lojasPermitidas)
      setLojas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function abrirModal(loja = null) {
    if (loja) {
      setEditando(loja)
      setNovaLoja({ nome: loja.nome, icon: loja.icon || '🏢', imagem: loja.imagem || null })
    } else {
      setEditando(null)
      setNovaLoja({ nome: '', icon: '🏢', imagem: null })
    }
    setShowModal(true)
  }

  function handleImagem(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 200
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > maxSize) { h = (h * maxSize) / w; w = maxSize }
        } else {
          if (h > maxSize) { w = (w * maxSize) / h; h = maxSize }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const comprimida = canvas.toDataURL('image/png')
        setNovaLoja(prev => ({ ...prev, imagem: comprimida, icon: '' }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleSalvar() {
    if (!novaLoja.nome.trim()) return
    try {
      if (editando) {
        await updateLoja(editando.id, {
          nome: novaLoja.nome,
          icon: novaLoja.icon,
          imagem: novaLoja.imagem || null
        })
      } else {
        await addLoja(user.uid, {
          nome: novaLoja.nome,
          icon: novaLoja.imagem ? '' : novaLoja.icon,
          imagem: novaLoja.imagem || null
        })
      }
      setShowModal(false)
      setNovaLoja({ nome: '', icon: '🏢', imagem: null })
      setEditando(null)
      carregarLojas()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(lojaId) {
    if (!confirm('Tem certeza que quer excluir esta loja?')) return
    await deleteLoja(lojaId)
    carregarLojas()
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const nomeUsuario = user?.displayName || user?.email?.split('@')[0] || 'Usuário'

  function getSaudacao() {
    const hora = new Date().getHours()
    if (hora >= 5 && hora < 12) return 'Bom dia'
    if (hora >= 12 && hora < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033] overflow-hidden">

      {/* Glow de fundo igual ao login */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />

        {/* Topbar */}
      <div className="relative z-10 px-5 pt-12 pb-4 flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-purple-400">{getSaudacao()},</p>
          <h1 className="text-xl font-black capitalize text-white">
            {nomeUsuario} 👋
          </h1>
        </div>
        <div className="flex gap-2">

          {/* Menu compacto */}
          <div className="flex flex-col gap-1 justify-center bg-white/5 border border-white/10 rounded-2xl px-2 py-1.5">
            <div className="flex gap-1">
              <button onClick={handleLogout} className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white/5">
                🚪
              </button>
              {(isAdmin || isModerador || perfil?.cargo === 'funcionario') && (
                <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white/5">
                  ⚙️
                </button>
              )}
              {isAdmin && (
                <button onClick={() => navigate('/usuarios')} className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white/5">
                  👥
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-5 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-purple-500">
          {isAdmin ? 'Suas lojas' : isModerador ? 'Lojas com acesso' : 'Minhas lojas'}
        </h2>
      </div>

      {/* Lista de lojas */}
      <div className="relative z-10 px-5 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-purple-400 animate-pulse">Carregando...</p>
        ) : lojas.length === 0 ? (
          <p className="text-sm text-purple-400">Nenhuma loja disponível.</p>
        ) : (
          lojas.map(loja => (
            <div
              key={loja.id}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-purple-900/20"
            >
              <button onClick={() => navigate(`/loja/${loja.id}`)} className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white/10">
                  {loja.imagem
                    ? <img src={loja.imagem} alt={loja.nome} className="w-full h-full object-cover" />
                    : <span className="text-2xl">{loja.icon}</span>
                  }
                </div>
              </button>

              <button onClick={() => navigate(`/loja/${loja.id}`)} className="flex-1 text-left">
                <p className="font-bold text-base text-white">{loja.nome}</p>
                <p className="text-xs mt-0.5 text-purple-400">Toque para ver o dashboard</p>
              </button>

              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirModal(loja)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-white/5 border border-white/10"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(loja.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-white/5 border border-white/10"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {isAdmin && (
          <button
            onClick={() => abrirModal()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500 transition-all"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5">＋</div>
            <p className="font-semibold text-sm text-purple-400">Adicionar nova loja</p>
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="w-full max-w-sm rounded-t-3xl p-6 bg-[#14002a] border-t border-white/10 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-4 text-white">
              {editando ? 'Editar loja' : 'Nova loja'}
            </h3>

            <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Nome da loja</label>
            <input
              type="text"
              value={novaLoja.nome}
              onChange={e => setNovaLoja(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Loja do Detran"
              className="w-full mt-1 mb-4 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-purple-700 focus:border-purple-500 transition-all"
            />

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden bg-white/10">
                {novaLoja.imagem
                  ? <img src={novaLoja.imagem} alt="preview" className="w-full h-full object-cover" />
                  : <span className="text-3xl">{novaLoja.icon}</span>
                }
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current.click()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-purple-300"
                >
                  📷 Usar foto
                </button>
                {novaLoja.imagem && (
                  <button
                    onClick={() => setNovaLoja(prev => ({ ...prev, imagem: null, icon: '🏢' }))}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400"
                  >
                    ✕ Remover foto
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagem} />
              </div>
            </div>

            {!novaLoja.imagem && (
              <>
                <label className="text-xs font-semibold uppercase tracking-wide text-purple-400">Ou escolha um ícone</label>
                <div className="flex flex-wrap gap-2 mt-2 mb-5">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNovaLoja(prev => ({ ...prev, icon }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${novaLoja.icon === icon ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setEditando(null) }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-purple-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}