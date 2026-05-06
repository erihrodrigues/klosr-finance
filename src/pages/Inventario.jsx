import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getLojas, getCategorias, getItensInventario, addItemInventario, updateItemInventario, deleteItemInventario } from '../firebase/db'
import { logout } from '../firebase/auth'

export default function Inventario() {
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const [loja, setLoja] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [itens, setItens] = useState([])
  const [novoExtra, setNovoExtra] = useState('')
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('falta') // 'falta' | 'lista' | 'extras'

  useEffect(() => {
    if (perfil) carregarDados()
  }, [perfil])

  async function carregarDados() {
    setLoading(true)
    try {
      const lojasPermitidas = perfil?.lojas || []
      const lojas = await getLojas(user.uid, lojasPermitidas)
      const lojaAtual = lojas[0]
      setLoja(lojaAtual)
      if (lojaAtual) {
        const cats = await getCategorias(lojaAtual.id)
        setCategorias(cats)
        const its = await getItensInventario(lojaAtual.id)
        setItens(its)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
    if (!novoExtra.trim() || !loja) return
    try {
      await addItemInventario(loja.id, null, novoExtra.trim())
      setNovoExtra('')
      carregarDados()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(itemId) {
    try {
      await deleteItemInventario(itemId)
      setItens(prev => prev.filter(i => i.id !== itemId))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const itensBase = itens.filter(i => !i.extra && i.categoriaId)
  const itensExtras = itens.filter(i => i.extra || !i.categoriaId)
  const itensFalta = itens.filter(i => i.falta)
  const totalFalta = itensFalta.length

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
      <div className="px-5 pt-10 pb-4 flex justify-between items-center">
        <div>
          <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-500"}`}>
            {loja?.icon} {loja?.nome}
          </p>
          <h1 className={`text-xl font-black ${dark ? "text-white" : "text-purple-950"}`}>
            Inventário 📦
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${dark ? "bg-purple-900" : "bg-white"}`}
        >
          🚪
        </button>
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
          <p className={`text-xs font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>Total</p>
          <p className={`font-black text-2xl ${dark ? "text-white" : "text-purple-950"}`}>{itens.length}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="px-5 mb-4 flex gap-2">
        <button
          onClick={() => setAba('falta')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'falta' ? 'bg-red-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          🚨 Em Falta {totalFalta > 0 && <span className="ml-1 bg-white/20 px-1.5 rounded-full text-xs">{totalFalta}</span>}
        </button>
        <button
          onClick={() => setAba('lista')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'lista' ? 'bg-purple-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          📋 Lista
        </button>
        <button
          onClick={() => setAba('extras')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'extras' ? 'bg-purple-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          ➕ Extras
        </button>
      </div>

      {/* Aba Em Falta — só os itens marcados */}
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
        </div>
      )}

      {/* Aba Lista — itens por categoria */}
      {aba === 'lista' && (
        <>
          {categorias.length === 0 ? (
            <div className="px-5 text-center py-10">
              <p className={`text-sm ${dark ? "text-purple-600" : "text-purple-300"}`}>
                Nenhum item no inventário ainda. O admin precisa criar os itens.
              </p>
            </div>
          ) : (
            categorias.map(cat => {
              const itensCategoria = itensBase.filter(i => i.categoriaId === cat.id)
              return (
                <div key={cat.id} className={`mx-5 mb-4 rounded-2xl border overflow-hidden ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
                  <div className={`px-4 py-3 ${dark ? "bg-purple-800" : "bg-purple-50"}`}>
                    <p className={`font-bold text-sm ${dark ? "text-white" : "text-purple-950"}`}>{cat.nome}</p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {itensCategoria.length === 0 && (
                      <p className={`text-xs ${dark ? "text-purple-600" : "text-purple-300"}`}>Nenhum item nesta categoria.</p>
                    )}
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
            })
          )}
        </>
      )}

      {/* Aba Extras */}
      {aba === 'extras' && (
        <div className="px-5">
          <div className={`mb-4 p-4 rounded-2xl border ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? "text-purple-400" : "text-purple-400"}`}>
              Adicionar item extra
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={novoExtra}
                onChange={e => setNovoExtra(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddExtra()}
                placeholder="Ex: Copo descartável 200ml"
                className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border ${dark ? "bg-purple-950 border-purple-800 text-white placeholder-purple-700" : "bg-purple-50 border-purple-100 text-purple-950"}`}
              />
              <button
                onClick={handleAddExtra}
                className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {itensExtras.length === 0 ? (
            <p className={`text-center text-sm py-6 ${dark ? "text-purple-600" : "text-purple-300"}`}>
              Nenhum item extra adicionado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {itensExtras.map(item => (
                <div key={item.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
                  <button
                    onClick={() => handleToggleFalta(item)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.falta ? 'border-red-400' : 'border-green-400 bg-green-400'}`}
                  >
                    {!item.falta && <span className="text-white text-xs">✓</span>}
                  </button>
                  <p className={`flex-1 text-sm ${dark ? "text-white" : "text-purple-950"}`}>{item.nome}</p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`text-sm ${dark ? "text-purple-600 hover:text-red-400" : "text-purple-300 hover:text-red-400"}`}
                  >
                    ✕
                  </button>
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