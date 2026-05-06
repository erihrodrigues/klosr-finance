import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { getLojas, saveFechamento, getFechamento } from '../firebase/db'
import { useAuth } from '../context/AuthContext'

export default function Fechamento() {
  const { id, dia } = useParams()
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const isAdmin = perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin'
  const isFuncionario = perfil?.cargo === 'funcionario'
  const soLeitura = !isAdmin

  const [loja, setLoja] = useState(null)
  const [pix, setPix] = useState('')
  const [cartao, setCartao] = useState('')
  const [dinheiro, setDinheiro] = useState('')
  const [gastos, setGastos] = useState([])
  const [descGasto, setDescGasto] = useState('')
  const [valGasto, setValGasto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [formaGasto, setFormaGasto] = useState('dinheiro')

  useEffect(() => {
  carregarDados()
}, [id, dia])

  useEffect(() => {
    if (isFuncionario) navigate(`/loja/${id}`)
  }, [isFuncionario])

  async function carregarDados() {
    try {
      const lojasPermitidas = (perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin') ? null : perfil?.lojas
      const lojas = await getLojas(user.uid, lojasPermitidas)
      const lojaAtual = lojas.find(l => l.id === id)
      setLoja(lojaAtual)

      // Params da URL têm prioridade (transferência do fechamento do funcionário)
      const params = new URLSearchParams(window.location.search)
      if (isAdmin && params.get('pix') !== null) {
        setPix(params.get('pix'))
        setCartao(params.get('cartao'))
        setDinheiro(params.get('dinheiro'))
        try {
          setGastos(JSON.parse(params.get('gastos') || '[]'))
        } catch { setGastos([]) }
        return
      }

      // Sem params — carrega do Firestore normalmente
      const fechamento = await getFechamento(id, dia)
      if (fechamento) {
        setPix(fechamento.pix || '')
        setCartao(fechamento.cartao || '')
        setDinheiro(fechamento.dinheiro || '')
        setGastos(fechamento.gastos || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function parseVal(v) {
    return parseFloat(v) || 0
  }

  const venda = parseVal(pix) + parseVal(cartao) + parseVal(dinheiro)
  const totalGastos = gastos.reduce((s, g) => s + (g.val || 0), 0)
  const saldo = venda - totalGastos

  function addGasto() {
    if (!descGasto.trim() || !valGasto) return
    setGastos(prev => [...prev, { desc: descGasto.trim(), val: parseFloat(valGasto), forma: formaGasto }])
    setDescGasto('')
    setValGasto('')
    setFormaGasto('dinheiro')
  }

  function removeGasto(index) {
    setGastos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSalvar() {
    setSalvando(true)
    try {
      await saveFechamento(id, {
        data: dia,
        pix: parseVal(pix),
        cartao: parseVal(cartao),
        dinheiro: parseVal(dinheiro),
        gastos,
        venda,
        totalGastos,
        saldo,
      })
      setSalvo(true)
      setTimeout(() => {
        navigate(`/loja/${id}`)
      }, 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const dataFormatada = new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const inputClass = (extra = '') =>
    `w-36 px-3 py-2 rounded-xl text-sm text-right outline-none border ${
      dark ? "bg-purple-950 border-purple-800 text-white" : "bg-purple-50 border-purple-100 text-purple-950"
    } ${soLeitura ? 'opacity-70 cursor-default' : ''} ${extra}`

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
            {loja?.icon} Fechamento do dia
          </h1>
        </div>
        {/* Badge somente leitura */}
        {soLeitura && (
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${dark ? "bg-purple-800 text-purple-300" : "bg-purple-100 text-purple-500"}`}>
            👁️ Visualização
          </span>
        )}
      </div>

      {/* Entradas */}
      <div className={`mx-5 mb-3 p-5 rounded-2xl border ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
        <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dark ? "text-purple-400" : "text-purple-400"}`}>
          Entradas
        </h2>

        {[
          { label: '📱 PIX', value: pix, setter: setPix },
          { label: '💳 Cartão', value: cartao, setter: setCartao },
          { label: '💵 Dinheiro', value: dinheiro, setter: setDinheiro },
        ].map(({ label, value, setter }) => (
          <div key={label} className="flex items-center justify-between mb-3 last:mb-0">
            <label className={`text-sm font-medium ${dark ? "text-purple-300" : "text-purple-700"}`}>
              {label}
            </label>
            {soLeitura ? (
              <span className={`w-36 px-3 py-2 rounded-xl text-sm text-right font-bold ${dark ? "bg-purple-950 border border-purple-800 text-white" : "bg-purple-50 border border-purple-100 text-purple-950"}`}>
                {fmt(parseVal(value))}
              </span>
            ) : (
              <input
                type="number"
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className={inputClass()}
              />
            )}
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

        {gastos.length === 0 && (
          <p className={`text-sm mb-3 ${dark ? "text-purple-600" : "text-purple-300"}`}>Nenhum gasto registrado.</p>
        )}

        {gastos.map((g, i) => (
          <div key={i} className={`flex items-center gap-2 mb-2 p-3 rounded-xl ${dark ? "bg-purple-950" : "bg-purple-50"}`}>
            <span className="text-base">
              {g.forma === 'pix' ? '📱' : g.forma === 'cartao' ? '💳' : '💵'}
            </span>
            <span className={`flex-1 text-sm ${dark ? "text-purple-300" : "text-purple-700"}`}>{g.desc}</span>
            <span className="text-red-400 font-bold text-sm">- {fmt(g.val)}</span>
            {isAdmin && (
              <button onClick={() => removeGasto(i)} className="text-purple-400 hover:text-red-400 ml-1 text-lg">✕</button>
            )}
          </div>
        ))}

        {/* Formulário de novo gasto — só Admin */}
        {isAdmin && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={descGasto}
                onChange={e => setDescGasto(e.target.value)}
                placeholder="Descrição (ex: mercado)"
                className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none border ${dark ? "bg-purple-950 border-purple-800 text-white placeholder-purple-700" : "bg-purple-50 border-purple-100 text-purple-950"}`}
              />
              <input
                type="number"
                value={valGasto}
                onChange={e => setValGasto(e.target.value)}
                placeholder="R$"
                min="0"
                step="0.01"
                className={`w-24 px-3 py-2 rounded-xl text-sm text-right outline-none border ${dark ? "bg-purple-950 border-purple-800 text-white" : "bg-purple-50 border-purple-100 text-purple-950"}`}
              />
            </div>
            <div className="flex gap-2">
              {[{ key: 'dinheiro', icon: '💵' }, { key: 'pix', icon: '📱' }, { key: 'cartao', icon: '💳' }].map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => setFormaGasto(key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formaGasto === key ? 'bg-purple-500 text-white' : dark ? 'bg-purple-800 text-purple-400' : 'bg-purple-50 text-purple-400'}`}
                >
                  {icon}
                </button>
              ))}
              <button
                onClick={addGasto}
                className="w-10 h-10 bg-purple-500 text-white rounded-xl font-bold text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
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

      {/* Botão salvar — só Admin */}
      {isAdmin && (
        <div className="px-5">
          <button
            onClick={handleSalvar}
            disabled={salvando || salvo}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white font-black rounded-2xl transition-all text-base"
          >
            {salvo ? '✅ Salvo!' : salvando ? 'Salvando...' : '💾 Salvar Fechamento'}
          </button>
        </div>
      )}

    </div>
  )
}