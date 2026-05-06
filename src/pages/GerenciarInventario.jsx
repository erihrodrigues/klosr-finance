import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getLojas, getCategorias, addCategoria, deleteCategoria, getItensInventario, addItemInventario, deleteItemInventario, updateItemInventario, getExtrasInventario, addExtraInventario, deleteExtraInventario } from '../firebase/db'

export default function GerenciarInventario() {
  const { id } = useParams()
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const isAdmin = perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin'
  const isModerador = perfil?.cargo === 'moderador'
  const isFuncionario = perfil?.cargo === 'funcionario'

  const [loja, setLoja] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [itens, setItens] = useState([])
  const [extras, setExtras] = useState([])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [novoItem, setNovoItem] = useState({})
  const [novoExtra, setNovoExtra] = useState('')
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState(isAdmin ? 'gerenciar' : 'falta')

  useEffect(() => { carregarDados() }, [id])

  async function carregarDados() {
    setLoading(true)
    try {
      const lojas = await getLojas(user.uid)
      setLoja(lojas.find(l => l.id === id))
      const cats = await getCategorias(id)
      setCategorias(cats)
      const its = await getItensInventario(id)
      setItens(its)
      const exts = await getExtrasInventario(id)
      setExtras(exts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCategoria() {
    if (!novaCategoria.trim()) return
    await addCategoria(id, novaCategoria.trim())
    setNovaCategoria('')
    carregarDados()
  }

  async function handleDeleteCategoria(catId) {
    if (!confirm('Excluir categoria e todos os itens dela?')) return
    const itensCategoria = itens.filter(i => i.categoriaId === catId)
    await Promise.all(itensCategoria.map(i => deleteItemInventario(i.id)))
    await deleteCategoria(catId)
    carregarDados()
  }

  async function handleAddItem(catId) {
    const nome = novoItem[catId]
    if (!nome?.trim()) return
    await addItemInventario(id, catId, nome.trim())
    setNovoItem(prev => ({ ...prev, [catId]: '' }))
    carregarDados()
  }

  async function handleDeleteItem(itemId) {
    await deleteItemInventario(itemId)
    setItens(prev => prev.filter(i => i.id !== itemId))
  }

  async function handleToggleFalta(item) {
    try {
      await updateItemInventario(item.id, { falta: !item.falta })
      setItens(prev => prev.map(i => i.id === item.id ? { ...i, falta: !i.falta } : i))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddExtra() {
    if (!novoExtra.trim()) return
    await addExtraInventario(id, novoExtra.trim(), user.uid, perfil?.nome || user?.email)
    setNovoExtra('')
    carregarDados()
  }

  async function handleExtraComprado(extraId) {
    await deleteExtraInventario(extraId)
    setExtras(prev => prev.filter(e => e.id !== extraId))
  }

  const itensFalta = itens.filter(i => i.falta)
  const totalFalta = itensFalta.length
  const totalExtras = extras.length

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
        <p className="text-purple-400 animate-pulse">Carregando...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pb-10 ${dark ? "bg-purple-950" : "bg-purple-50"}`}>

      {/* Topbar */}
      <div className="px-5 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(`/loja/${id}`)}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? "bg-purple-900 text-white" : "bg-white text-purple-950"}`}
        >
          ←
        </button>
        <div className="flex-1">
          <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-500"}`}>
            {loja?.icon} {loja?.nome}
          </p>
          <h1 className={`text-lg font-black ${dark ? "text-white" : "text-purple-950"}`}>
            Inventário 📦
          </h1>
        </div>
      </div>

      {/* Resumo */}
      <div className="px-5 mb-4 flex gap-3">
        <div className={`flex-1 p-4 rounded-2xl ${dark ? "bg-purple-900 border border-purple-800" : "bg-white border border-purple-100"}`}>
          <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>Em falta</p>
          <p className="text-red-400 font-black text-2xl">{totalFalta}</p>
        </div>
        <div className={`flex-1 p-4 rounded-2xl ${dark ? "bg-purple-900 border border-purple-800" : "bg-white border border-purple-100"}`}>
          <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>OK</p>
          <p className="text-green-400 font-black text-2xl">{itens.length - totalFalta}</p>
        </div>
        <div className={`flex-1 p-4 rounded-2xl ${dark ? "bg-purple-900 border border-purple-800" : "bg-white border border-purple-100"}`}>
          <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>Extras</p>
          <p className={`font-black text-2xl ${totalExtras > 0 ? 'text-yellow-400' : dark ? 'text-white' : 'text-purple-950'}`}>{totalExtras}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="px-5 mb-4 flex gap-2">
        {isAdmin && (
          <button
            onClick={() => setAba('gerenciar')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'gerenciar' ? 'bg-purple-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
          >
            📦 Gerenciar
          </button>
        )}
        <button
          onClick={() => setAba('falta')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'falta' ? 'bg-red-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          🚨 Em Falta {totalFalta > 0 && (
            <span className="ml-1 bg-white/20 px-1.5 rounded-full text-xs">{totalFalta}</span>
          )}
        </button>
        <button
          onClick={() => setAba('extra')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all relative ${aba === 'extra' ? 'bg-yellow-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          ➕ Extra
          {totalExtras > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center">
              {totalExtras}
            </span>
          )}
        </button>
      </div>

      {/* Aba Gerenciar — só admin */}
      {aba === 'gerenciar' && isAdmin && (
        <>
          <div className={`mx-5 mb-4 p-4 rounded-2xl border ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? "text-purple-400" : "text-purple-400"}`}>
              Nova categoria
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategoria()}
                placeholder="Ex: Bebidas, Salgados..."
                className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border ${dark ? "bg-purple-950 border-purple-800 text-white placeholder-purple-700" : "bg-purple-50 border-purple-100 text-purple-950"}`}
              />
              <button
                onClick={handleAddCategoria}
                className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {categorias.length === 0 ? (
            <div className="px-5 text-center py-10">
              <p className={`text-sm ${dark ? "text-purple-600" : "text-purple-300"}`}>
                Nenhuma categoria ainda. Adicione uma acima!
              </p>
            </div>
          ) : (
            categorias.map(cat => {
              const itensCategoria = itens.filter(i => i.categoriaId === cat.id)
              return (
                <div key={cat.id} className={`mx-5 mb-4 rounded-2xl border overflow-hidden ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${dark ? "bg-purple-800" : "bg-purple-50"}`}>
                    <p className={`font-bold text-sm ${dark ? "text-white" : "text-purple-950"}`}>
                      {cat.nome}
                      <span className={`ml-2 text-xs font-normal ${dark ? "text-purple-400" : "text-purple-400"}`}>
                        {itensCategoria.length} {itensCategoria.length === 1 ? 'item' : 'itens'}
                      </span>
                    </p>
                    <button onClick={() => handleDeleteCategoria(cat.id)} className="text-red-400 text-sm px-2 py-1 rounded-lg hover:bg-red-400/10">
                      🗑️
                    </button>
                  </div>
                  <div className="p-4">
                    {itensCategoria.length === 0 && (
                      <p className={`text-xs mb-3 ${dark ? "text-purple-600" : "text-purple-300"}`}>Nenhum item ainda.</p>
                    )}
                    <div className="flex flex-col gap-2 mb-3">
                      {itensCategoria.map(item => (
                        <div key={item.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
                          <span className="text-purple-400 text-xs">▸</span>
                          <p className={`flex-1 text-sm ${dark ? "text-purple-300" : "text-purple-700"}`}>{item.nome}</p>
                          <button onClick={() => handleDeleteItem(item.id)} className={`text-sm px-2 py-1 rounded-lg transition-colors ${dark ? "text-purple-600 hover:text-red-400" : "text-purple-300 hover:text-red-400"}`}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novoItem[cat.id] || ''}
                        onChange={e => setNovoItem(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddItem(cat.id)}
                        placeholder="Adicionar item..."
                        className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none border ${dark ? "bg-purple-950 border-purple-800 text-white placeholder-purple-700" : "bg-purple-50 border-purple-100 text-purple-950"}`}
                      />
                      <button onClick={() => handleAddItem(cat.id)} className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-lg flex items-center justify-center">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {/* Aba Em Falta */}
      {aba === 'falta' && (
        <div className="px-5">
          {itensFalta.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">✅</p>
              <p className={`text-sm font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>
                Nenhum item em falta!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {itensFalta.map(item => {
                const cat = categorias.find(c => c.id === item.categoriaId)
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-4 rounded-2xl border border-red-400/30 ${dark ? "bg-red-950/30" : "bg-red-50"}`}>
                    <button
                      onClick={() => handleToggleFalta(item)}
                      className="w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-purple-950"}`}>{item.nome}</p>
                      {cat && <p className={`text-xs ${dark ? "text-purple-500" : "text-purple-400"}`}>{cat.nome}</p>}
                    </div>
                    <span className="text-red-400 text-xs font-bold">FALTA</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6">
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? "text-purple-600" : "text-purple-300"}`}>
              Lista completa
            </p>
            {categorias.map(cat => {
              const itensCategoria = itens.filter(i => i.categoriaId === cat.id)
              if (itensCategoria.length === 0) return null
              return (
                <div key={cat.id} className={`mb-4 rounded-2xl border overflow-hidden ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
                  <div className={`px-4 py-3 ${dark ? "bg-purple-800" : "bg-purple-50"}`}>
                    <p className={`font-bold text-sm ${dark ? "text-white" : "text-purple-950"}`}>{cat.nome}</p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {itensCategoria.map(item => (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
                        <button
                          onClick={() => handleToggleFalta(item)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.falta ? 'border-red-400 bg-transparent' : 'border-green-400 bg-green-400'}`}
                        >
                          {!item.falta && <span className="text-white text-xs">✓</span>}
                        </button>
                        <p className={`flex-1 text-sm ${item.falta ? (dark ? 'text-white font-semibold' : 'text-purple-950 font-semibold') : (dark ? 'text-purple-500' : 'text-purple-400')}`}>
                          {item.nome}
                        </p>
                        {item.falta && <span className="text-red-400 text-xs font-bold">FALTA</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Aba Extra — todos os cargos */}
      {aba === 'extra' && (
        <div className="px-5">
          {/* Adicionar extra */}
          <div className={`p-4 rounded-2xl border mb-4 ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${dark ? "text-purple-400" : "text-purple-500"}`}>
              Adicionar item extra
            </p>
            <p className={`text-xs mb-3 ${dark ? "text-purple-500" : "text-purple-400"}`}>
              Item temporário que some quando comprado.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={novoExtra}
                onChange={e => setNovoExtra(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddExtra()}
                placeholder="Ex: Detergente, Vassoura..."
                className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border ${dark ? "bg-purple-950 border-purple-800 text-white placeholder-purple-700" : "bg-purple-50 border-purple-100 text-purple-950"}`}
              />
              <button
                onClick={handleAddExtra}
                className="w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Lista de extras */}
          {extras.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">✨</p>
              <p className={`text-sm font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>
                Nenhum item extra pendente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {extras.map(extra => (
                <div key={extra.id} className={`flex items-center gap-3 p-4 rounded-2xl border border-yellow-400/30 ${dark ? "bg-yellow-950/20" : "bg-yellow-50"}`}>
                  <button
                    onClick={() => handleExtraComprado(extra.id)}
                    className="w-6 h-6 rounded-full border-2 border-yellow-400 flex items-center justify-center flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${dark ? "text-white" : "text-purple-950"}`}>{extra.nome}</p>
                    <p className={`text-xs ${dark ? "text-purple-500" : "text-purple-400"}`}>
                      por {extra.nomeUsuario}
                    </p>
                  </div>
                  <span className="text-yellow-500 text-xs font-bold">EXTRA</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}