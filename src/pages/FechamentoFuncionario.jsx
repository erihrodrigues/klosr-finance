import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getLojas, getFechamentoFuncionario, saveFechamentoFuncionario } from '../firebase/db'

export default function FechamentoFuncionario() {
  const { id, dia } = useParams()
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [loja, setLoja] = useState(null)
  const [pix, setPix] = useState('')
  const [cartao, setCartao] = useState('')
  const [dinheiro, setDinheiro] = useState('')
  const [gastos, setGastos] = useState([])
  const [descGasto, setDescGasto] = useState('')
  const [valGasto, setValGasto] = useState('')
  const [notas, setNotas] = useState([]) // fotos base64
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const [minutosRestantes, setMinutosRestantes] = useState(null)
  const [existente, setExistente] = useState(null)
  const [aba, setAba] = useState('fechamento')
  const [fotoAmpliada, setFotoAmpliada] = useState(null)
  const [formaGasto, setFormaGasto] = useState('dinheiro')

  useEffect(() => { carregarDados() }, [id, dia])

  useEffect(() => {
    if (!existente) return
    const interval = setInterval(() => {
      const criadoEm = new Date(existente.criadoEm)
      const diff = 60 * 60 * 1000 - (Date.now() - criadoEm.getTime())
      if (diff <= 0) {
        setBloqueado(true)
        setMinutosRestantes(0)
        clearInterval(interval)
      } else {
        setMinutosRestantes(Math.ceil(diff / 60000))
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [existente])

  async function carregarDados() {
    try {
      const lojasPermitidas = perfil?.lojas || []
      const lojas = await getLojas(user.uid, lojasPermitidas)
      setLoja(lojas.find(l => l.id === id))
      const fec = await getFechamentoFuncionario(id, user.uid, dia)
      if (fec) {
        setExistente(fec)
        setPix(fec.pix || '')
        setCartao(fec.cartao || '')
        setDinheiro(fec.dinheiro || '')
        setGastos(fec.gastos || [])
        setNotas(fec.notas || [])
        const criadoEm = new Date(fec.criadoEm)
        const diff = 60 * 60 * 1000 - (Date.now() - criadoEm.getTime())
        if (diff <= 0) {
          setBloqueado(true)
          setMinutosRestantes(0)
        } else {
          setMinutosRestantes(Math.ceil(diff / 60000))
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function parseVal(v) { return parseFloat(v) || 0 }

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

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (notas.length >= 3) {
      alert('Máximo de 3 fotos por dia.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 800
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
        const comprimida = canvas.toDataURL('image/jpeg', 0.6)
        setNotas(prev => [...prev, comprimida])
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removeNota(index) {
    setNotas(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSalvar() {
    if (bloqueado) return
    setSalvando(true)
    try {
      const criadoEm = existente?.criadoEm || new Date().toISOString()
      await saveFechamentoFuncionario(id, user.uid, {
        data: dia,
        pix: parseVal(pix),
        cartao: parseVal(cartao),
        dinheiro: parseVal(dinheiro),
        gastos,
        notas,
        venda,
        totalGastos,
        saldo,
        nomeUsuario: perfil?.nome || user?.displayName || user?.email,
        criadoEm
      })
      setSalvo(true)
      setExistente(prev => prev || { criadoEm })
      setTimeout(() => navigate(`/loja/${id}`), 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const dataFormatada = new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const inputClass = `w-36 px-3 py-2 rounded-xl text-sm text-right outline-none border ${
    dark ? "bg-purple-950 border-purple-800 text-white" : "bg-purple-50 border-purple-100 text-purple-950"
  } ${bloqueado ? 'opacity-50 cursor-default' : ''}`

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
            {loja?.icon} Meu Fechamento
          </h1>
        </div>
        {minutosRestantes !== null && !bloqueado && (
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${dark ? "bg-yellow-900 text-yellow-300" : "bg-yellow-50 text-yellow-600"}`}>
            ⏱ {minutosRestantes}min
          </span>
        )}
        {bloqueado && (
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${dark ? "bg-red-900 text-red-300" : "bg-red-50 text-red-500"}`}>
            🔒 Bloqueado
          </span>
        )}
      </div>

      {/* Aviso bloqueado */}
      {bloqueado && (
        <div className={`mx-5 mb-4 p-4 rounded-2xl border border-red-400/30 ${dark ? "bg-red-950/30" : "bg-red-50"}`}>
          <p className="text-red-400 text-sm font-semibold">
            🔒 O prazo de 1 hora para editar passou. Este fechamento está bloqueado.
          </p>
        </div>
      )}

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
              { label: '📱 PIX', value: pix, setter: setPix },
              { label: '💳 Cartão', value: cartao, setter: setCartao },
              { label: '💵 Dinheiro', value: dinheiro, setter: setDinheiro },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center justify-between mb-3 last:mb-0">
                <label className={`text-sm font-medium ${dark ? "text-purple-300" : "text-purple-700"}`}>{label}</label>
                {bloqueado ? (
                  <span className={`w-36 px-3 py-2 rounded-xl text-sm text-right font-bold ${dark ? "bg-purple-950 border border-purple-800 text-white" : "bg-purple-50 border border-purple-100 text-purple-950"}`}>
                    {fmt(parseVal(value))}
                  </span>
                ) : (
                  <input type="number" value={value} onChange={e => setter(e.target.value)} placeholder="0,00" min="0" step="0.01" className={inputClass} />
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
                {!bloqueado && (
                  <button onClick={() => removeGasto(i)} className="text-purple-400 hover:text-red-400 ml-1 text-lg">✕</button>
                )}
              </div>
            ))}
            {!bloqueado && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={descGasto}
                    onChange={e => setDescGasto(e.target.value)}
                    placeholder="Descrição"
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
                  <button onClick={addGasto} className="w-10 h-10 bg-purple-500 text-white rounded-xl font-bold text-xl flex items-center justify-center">+</button>
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
        </>
      )}

      {/* ── ABA NOTA FISCAL ── */}
      {aba === 'notas' && (
        <div className="px-5">
          <div className={`p-4 rounded-2xl border mb-4 ${dark ? "bg-purple-900 border-purple-800" : "bg-white border-purple-100"}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${dark ? "text-purple-400" : "text-purple-500"}`}>
              Comprovantes de gastos
            </p>
            <p className={`text-xs mb-4 ${dark ? "text-purple-500" : "text-purple-400"}`}>
              Tire foto dos comprovantes para o admin conferir. Máximo 3 fotos.
            </p>

            {!bloqueado && notas.length < 3 && (
              <>
                <button
                  onClick={() => fileRef.current.click()}
                  className={`w-full py-3 rounded-xl text-sm font-bold border-2 border-dashed transition-all ${dark ? "border-purple-700 text-purple-400 hover:border-purple-500" : "border-purple-200 text-purple-400 hover:border-purple-400"}`}
                >
                  📷 Adicionar foto ({notas.length}/3)
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
              </>
            )}
          </div>

          {notas.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🧾</p>
              <p className={`text-sm ${dark ? "text-purple-500" : "text-purple-400"}`}>
                Nenhum comprovante adicionado ainda.
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
                    className="w-full max-h-64 object-contain bg-black/10 rounded-t-2xl cursor-pointer active:opacity-80"
                    />
                    {!bloqueado && (
                    <button
                        onClick={() => removeNota(i)}
                        className={`w-full py-2 text-xs font-bold text-red-400 ${dark ? "bg-purple-900" : "bg-white"}`}
                    >
                        🗑️ Remover foto
                    </button>
                    )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

        {/* Visualizador de foto em tela cheia */}
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

      {/* Botão salvar */}
      {!bloqueado && (
        <div className="px-5 mt-5">
          <button
            onClick={handleSalvar}
            disabled={salvando || salvo}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white font-black rounded-2xl transition-all text-base"
          >
            {salvo ? '✅ Enviado!' : salvando ? 'Salvando...' : '📤 Enviar Fechamento'}
          </button>
        </div>
      )}
    </div>
  )
}