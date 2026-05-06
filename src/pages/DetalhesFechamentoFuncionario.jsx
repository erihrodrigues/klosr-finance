import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { getLojas } from '../firebase/db'

export default function DetalhesFechamentoFuncionario() {
  const { id, fechamentoId } = useParams()
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const isAdmin = perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin'

  const [fechamento, setFechamento] = useState(null)
  const [loja, setLoja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('fechamento')
  const [fotoAmpliada, setFotoAmpliada] = useState(null)

  useEffect(() => { carregarDados() }, [fechamentoId])

  async function carregarDados() {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'fechamentosFuncionario', fechamentoId))
      if (snap.exists()) setFechamento({ id: snap.id, ...snap.data() })
      const lojas = await getLojas(user.uid)
      setLoja(lojas.find(l => l.id === id))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function handleUsarNoOficial() {
    if (!fechamento) return
    try {
      const snap = await getDoc(doc(db, 'fechamentosFuncionario', fechamentoId))
      const dadosAtuais = snap.exists() ? { ...snap.data() } : fechamento
      const params = new URLSearchParams({
        pix: dadosAtuais.pix || 0,
        cartao: dadosAtuais.cartao || 0,
        dinheiro: dadosAtuais.dinheiro || 0,
        gastos: JSON.stringify(dadosAtuais.gastos || [])
      })
      navigate(`/loja/${id}/fechamento/${dadosAtuais.data}?${params.toString()}`)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
        <p className="text-purple-400 animate-pulse">Carregando...</p>
      </div>
    )
  }

  if (!fechamento) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
        <p className="text-purple-400">Fechamento não encontrado.</p>
      </div>
    )
  }

  const venda = (fechamento.pix || 0) + (fechamento.cartao || 0) + (fechamento.dinheiro || 0)
  const totalGastos = (fechamento.gastos || []).reduce((s, g) => s + (g.val || 0), 0)
  const saldo = venda - totalGastos
  const notas = fechamento.notas || []

  const dataFormatada = new Date(fechamento.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const criadoEm = new Date(fechamento.criadoEm)
  const bloqueado = (Date.now() - criadoEm.getTime()) > 60 * 60 * 1000

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
          <p className={`text-xs font-semibold capitalize ${dark ? "text-purple-400" : "text-purple-500"}`}>
            {dataFormatada}
          </p>
          <h1 className={`text-lg font-black ${dark ? "text-white" : "text-purple-950"}`}>
            👤 {fechamento.nomeUsuario || 'Funcionário'}
          </h1>
        </div>
        {bloqueado && (
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${dark ? "bg-green-900 text-green-300" : "bg-green-50 text-green-600"}`}>
            ✅ Enviado
          </span>
        )}
      </div>

      {/* Abas */}
      <div className="px-5 mb-4 flex gap-2">
        <button
          onClick={() => setAba('fechamento')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'fechamento' ? 'bg-purple-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          📋 Fechamento
        </button>
        <button
          onClick={() => setAba('notas')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all relative ${aba === 'notas' ? 'bg-purple-500 text-white' : dark ? 'bg-purple-900 text-purple-400' : 'bg-white text-purple-400'}`}
        >
          🧾 Nota Fiscal
          {notas.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
              {notas.length}
            </span>
          )}
        </button>
      </div>

      {/* ── ABA FECHAMENTO ── */}
      {aba === 'fechamento' && (
        <>
          {/* Entradas */}
          <div className={`mx-5 mb-3 p-5 rounded-2xl border ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? "text-purple-400" : "text-purple-400"}`}>
              Entradas
            </h2>
            {[
              { label: '📱 PIX', value: fechamento.pix || 0 },
              { label: '💳 Cartão', value: fechamento.cartao || 0 },
              { label: '💵 Dinheiro', value: fechamento.dinheiro || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between mb-3 last:mb-0">
                <span className={`text-sm font-medium ${dark ? "text-purple-300" : "text-purple-700"}`}>{label}</span>
                <span className={`w-36 px-3 py-2 rounded-xl text-sm text-right font-bold ${dark ? "bg-purple-950 border border-purple-800 text-white" : "bg-purple-50 border border-purple-100 text-purple-950"}`}>
                  {fmt(value)}
                </span>
              </div>
            ))}
            <div className={`flex justify-between items-center pt-3 mt-3 border-t ${dark ? "border-purple-800" : "border-purple-100"}`}>
              <span className={`text-sm font-bold ${dark ? "text-white" : "text-purple-950"}`}>Total venda</span>
              <span className="text-purple-500 font-black text-base">{fmt(venda)}</span>
            </div>
          </div>

          {/* Gastos */}
          <div className={`mx-5 mb-3 p-5 rounded-2xl border ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? "text-purple-400" : "text-purple-400"}`}>
              Gastos do dia
            </h2>
            {(fechamento.gastos || []).length === 0 ? (
              <p className={`text-sm ${dark ? "text-purple-600" : "text-purple-300"}`}>Nenhum gasto registrado.</p>
            ) : (
              (fechamento.gastos || []).map((g, i) => (
                <div key={i} className={`flex items-center gap-2 mb-2 p-3 rounded-xl ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
                  <span className="text-base">
                    {g.forma === 'pix' ? '📱' : g.forma === 'cartao' ? '💳' : '💵'}
                  </span>
                  <span className={`flex-1 text-sm ${dark ? "text-purple-300" : "text-purple-700"}`}>{g.desc}</span>
                  <span className="text-red-400 font-bold text-sm">- {fmt(g.val)}</span>
                </div>
              ))
            )}
            <div className={`flex justify-between items-center pt-3 mt-3 border-t ${dark ? "border-purple-800" : "border-purple-100"}`}>
              <span className={`text-sm font-bold ${dark ? "text-white" : "text-purple-950"}`}>Total gastos</span>
              <span className="text-red-400 font-black text-base">{fmt(totalGastos)}</span>
            </div>
          </div>

          {/* Saldo */}
          <div className={`mx-5 mb-5 p-5 rounded-2xl ${saldo >= 0 ? "bg-purple-500" : "bg-red-500"}`}>
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-sm font-semibold">Saldo do dia</p>
              <p className="text-white font-black text-2xl">{fmt(saldo)}</p>
            </div>
          </div>

          {/* Botão transferir — só admin */}
          {isAdmin && (
            <div className="px-5">
              <button
                onClick={handleUsarNoOficial}
                className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-2xl transition-all text-base"
              >
                📋 Transferir para fechamento oficial
              </button>
              <p className={`text-xs text-center mt-2 ${dark ? "text-purple-600" : "text-purple-400"}`}>
                Os valores serão pré-preenchidos para você revisar antes de salvar
              </p>
            </div>
          )}
        </>
      )}

      {/* ── ABA NOTA FISCAL ── */}
      {aba === 'notas' && (
        <div className="px-5">
          {notas.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🧾</p>
              <p className={`text-sm font-semibold ${dark ? "text-purple-400" : "text-purple-400"}`}>
                Nenhum comprovante enviado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notas.map((foto, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden border ${dark ? "border-purple-800" : "border-purple-100"}`}>
                  <img
                    src={foto}
                    alt={`Comprovante ${i + 1}`}
                    onClick={() => setFotoAmpliada(foto)}
                    className="w-full max-h-64 object-contain bg-black/10 cursor-pointer active:opacity-80"
                  />
                  <div className={`px-4 py-2 ${dark ? "bg-purple-900" : "bg-white"}`}>
                    <p className={`text-xs ${dark ? "text-purple-500" : "text-purple-400"}`}>
                      Comprovante {i + 1} · Toque para ampliar
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visualizador em tela cheia */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img
            src={fotoAmpliada}
            alt="Comprovante"
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
          <button
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full text-white text-xl flex items-center justify-center"
            onClick={() => setFotoAmpliada(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}