import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getLojas, criarUsuario } from '../firebase/db'
import { criarUsuarioAdmin } from '../firebase/auth'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function GerenciarUsuarios() {
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const isSuperAdmin = perfil?.cargo === 'superadmin'
  const isAdmin = perfil?.cargo === 'admin'

  const [usuarios, setUsuarios] = useState([])
  const [lojas, setLojas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [showCriar, setShowCriar] = useState(false)
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', cargo: 'funcionario', lojas: [] })
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const [snapUsuarios, lojasData] = await Promise.all([
        getDocs(collection(db, 'usuarios')),
        getLojas(user.uid)
      ])
      setUsuarios(snapUsuarios.docs.map(d => ({ id: d.id, ...d.data() })))
      setLojas(lojasData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSalvar() {
    if (!editando) return
    setSalvando(true)
    try {
      await updateDoc(doc(db, 'usuarios', editando.id), {
        cargo: editando.cargo,
        lojas: editando.lojas || []
      })
      setUsuarios(prev => prev.map(u => u.id === editando.id ? editando : u))
      setEditando(null)
      setSucesso('Usuário atualizado!')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  async function handleCriarUsuario() {
    if (!novoUsuario.email.trim() || !novoUsuario.senha.trim()) {
      setErro('Email e senha são obrigatórios.')
      return
    }
    setCriando(true)
    setErro('')
    try {
      const novoUser = await criarUsuarioAdmin(novoUsuario.email, novoUsuario.senha)
      await criarUsuario(novoUser.uid, {
        nome: novoUsuario.nome.trim(),
        email: novoUsuario.email.trim(),
        cargo: novoUsuario.cargo,
        lojas: novoUsuario.cargo === 'admin' || novoUsuario.cargo === 'superadmin' ? [] : novoUsuario.lojas
      })
      setShowCriar(false)
      setNovoUsuario({ nome: '', email: '', senha: '', cargo: 'funcionario', lojas: [] })
      setSucesso('Usuário criado com sucesso!')
      setTimeout(() => setSucesso(''), 3000)
      carregarDados()
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setErro('Este email já está em uso.')
      else if (err.code === 'auth/weak-password') setErro('Senha muito fraca. Use pelo menos 6 caracteres.')
      else setErro(`Erro: ${err.message}`)
    } finally {
      setCriando(false)
    }
  }

  function toggleLoja(lojaId, alvo = 'editando') {
    const setter = alvo === 'editando' ? setEditando : setNovoUsuario
    setter(prev => {
      const lojasSel = prev.lojas || []
      const jatem = lojasSel.includes(lojaId)
      return { ...prev, lojas: jatem ? lojasSel.filter(l => l !== lojaId) : [...lojasSel, lojaId] }
    })
  }

  const cargosPermitidos = isSuperAdmin
    ? ['superadmin', 'admin', 'moderador', 'funcionario']
    : ['moderador', 'funcionario']

  const cargoBadge = {
    superadmin: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    admin: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    moderador: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    funcionario: 'bg-green-500/20 text-green-400 border border-green-500/30'
  }

  const cargoEmoji = {
    superadmin: '👑',
    admin: '🔑',
    moderador: '🛡️',
    funcionario: '👤'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033]">
        <p className="text-purple-400 animate-pulse">Carregando...</p>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-purple-700 focus:border-purple-500 transition-all"
  const modalBase = "w-full max-w-sm rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto bg-[#14002a] border-t border-white/10"
  const btnCancelar = "flex-1 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-purple-300"
  const btnSalvar = "flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40 disabled:opacity-50"

  return (
    <div className="min-h-screen pb-10 relative bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033] overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />

      {/* Topbar */}
      <div className="relative z-10 px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold text-purple-400">Administração</p>
          <h1 className="text-lg font-black text-white">Gerenciar Usuários 👥</h1>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => { setShowCriar(true); setErro('') }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white font-bold text-xl shadow-lg shadow-purple-900/40"
          >
            +
          </button>
        )}
      </div>

      {/* Sucesso */}
      {sucesso && (
        <div className="relative z-10 mx-5 mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30">
          <p className="text-green-400 text-sm font-semibold text-center">{sucesso}</p>
        </div>
      )}

      {/* Resumo */}
      <div className="relative z-10 px-5 mb-4 flex gap-2 overflow-x-auto">
        {['superadmin', 'admin', 'moderador', 'funcionario'].map(cargo => (
          <div key={cargo} className="flex-shrink-0 p-3 rounded-2xl min-w-[80px] bg-white/5 backdrop-blur-xl border border-white/10">
            <p className="text-lg">{cargoEmoji[cargo]}</p>
            <p className="font-black text-xl text-white">
              {usuarios.filter(u => u.cargo === cargo).length}
            </p>
            <p className="text-xs font-semibold capitalize text-purple-400">{cargo}</p>
          </div>
        ))}
      </div>

      {/* Lista de usuários */}
      <div className="relative z-10 px-5 flex flex-col gap-3">
        {usuarios
          .sort((a, b) => {
            const ordem = { superadmin: 0, admin: 1, moderador: 2, funcionario: 3 }
            return (ordem[a.cargo] ?? 4) - (ordem[b.cargo] ?? 4)
          })
          .map(u => (
            <div key={u.id} className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-white/10">
                  {cargoEmoji[u.cargo] || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-white">
                    {u.nome || u.email || u.id}
                  </p>
                  <p className="text-xs truncate text-purple-400">
                    {u.email || u.id}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg capitalize ${cargoBadge[u.cargo] || 'bg-white/10 text-white'}`}>
                  {u.cargo || 'sem cargo'}
                </span>
              </div>

              {u.cargo !== 'admin' && u.cargo !== 'superadmin' && u.lojas?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {u.lojas.map(lojaId => {
                    const loja = lojas.find(l => l.id === lojaId)
                    return loja ? (
                      <span key={lojaId} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-purple-300">
                        {loja.icon} {loja.nome}
                      </span>
                    ) : null
                  })}
                </div>
              )}

              {u.id !== user.uid && (isSuperAdmin || (isAdmin && u.cargo !== 'admin' && u.cargo !== 'superadmin')) && (
                <button
                  onClick={() => setEditando(editando?.id === u.id ? null : { ...u, lojas: u.lojas || [] })}
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    editando?.id === u.id
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white'
                      : 'bg-white/5 border border-white/10 text-purple-300'
                  }`}
                >
                  {editando?.id === u.id ? 'Cancelar edição' : '✏️ Editar cargo e acesso'}
                </button>
              )}
              {u.id === user.uid && (
                <p className="mt-2 text-xs text-center text-purple-600">você</p>
              )}
            </div>
          ))}
      </div>

      {/* Modal editar usuário */}
      {editando && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className={modalBase}>
            <h3 className="text-lg font-bold mb-1 text-white">Editar usuário</h3>
            <p className="text-xs mb-5 text-purple-400">{editando.nome || editando.email || editando.id}</p>

            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-purple-400">Cargo</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {cargosPermitidos.map(c => (
                <button
                  key={c}
                  onClick={() => setEditando(prev => ({ ...prev, cargo: c }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    editando.cargo === c
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white'
                      : 'bg-white/5 border border-white/10 text-purple-300'
                  }`}
                >
                  {cargoEmoji[c]} {c}
                </button>
              ))}
            </div>

            {editando.cargo !== 'admin' && editando.cargo !== 'superadmin' && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest mb-2 text-purple-400">Acesso às lojas</p>
                <div className="flex flex-col gap-2 mb-5">
                  {lojas.map(loja => {
                    const selecionada = (editando.lojas || []).includes(loja.id)
                    return (
                      <button
                        key={loja.id}
                        onClick={() => toggleLoja(loja.id, 'editando')}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selecionada
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <span className="text-lg">{loja.icon || '🏢'}</span>
                        <span className="flex-1 text-sm font-semibold text-left text-white">{loja.nome}</span>
                        <span className={`text-lg ${selecionada ? 'text-purple-400' : 'text-purple-700'}`}>
                          {selecionada ? '✓' : '○'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {(editando.cargo === 'admin' || editando.cargo === 'superadmin') && (
              <p className="text-xs mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-purple-300">
                ℹ️ {editando.cargo === 'superadmin' ? 'Superadmin' : 'Admin'} tem acesso a todas as lojas automaticamente.
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className={btnCancelar}>Cancelar</button>
              <button onClick={handleSalvar} disabled={salvando} className={btnSalvar}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar usuário */}
      {showCriar && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className={modalBase}>
            <h3 className="text-lg font-bold mb-5 text-white">Criar novo usuário</h3>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-purple-400">Nome</p>
                <input type="text" value={novoUsuario.nome}
                  onChange={e => setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Valdemir" className={inputClass} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-purple-400">Email</p>
                <input type="email" value={novoUsuario.email}
                  onChange={e => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com" className={inputClass} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-purple-400">Senha inicial</p>
                <input type="text" value={novoUsuario.senha}
                  onChange={e => setNovoUsuario(prev => ({ ...prev, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres" className={inputClass} />
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-purple-400">Cargo</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {cargosPermitidos.map(c => (
                <button key={c}
                  onClick={() => setNovoUsuario(prev => ({ ...prev, cargo: c }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    novoUsuario.cargo === c
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white'
                      : 'bg-white/5 border border-white/10 text-purple-300'
                  }`}
                >
                  {cargoEmoji[c]} {c}
                </button>
              ))}
            </div>

            {novoUsuario.cargo !== 'admin' && novoUsuario.cargo !== 'superadmin' && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest mb-2 text-purple-400">Acesso às lojas</p>
                <div className="flex flex-col gap-2 mb-5">
                  {lojas.map(loja => {
                    const selecionada = novoUsuario.lojas.includes(loja.id)
                    return (
                      <button key={loja.id}
                        onClick={() => toggleLoja(loja.id, 'novo')}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selecionada ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <span className="text-lg">{loja.icon || '🏢'}</span>
                        <span className="flex-1 text-sm font-semibold text-left text-white">{loja.nome}</span>
                        <span className={`text-lg ${selecionada ? 'text-purple-400' : 'text-purple-700'}`}>
                          {selecionada ? '✓' : '○'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {erro && <p className="text-red-400 text-sm text-center mb-3">{erro}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setShowCriar(false); setErro('') }} className={btnCancelar}>Cancelar</button>
              <button onClick={handleCriarUsuario} disabled={criando} className={btnSalvar}>
                {criando ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}