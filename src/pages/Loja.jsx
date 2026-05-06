import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { getLojas, getFechamentos, getItensInventario, getFechamentosFuncionariosByLoja } from '../firebase/db'
import { useAuth } from '../context/AuthContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function getHoje() {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export default function Loja() {
  const { id } = useParams()
  const { dark } = useTheme()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const isSuperAdmin = perfil?.cargo === 'superadmin'
  const isAdmin = perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin'
  const isModerador = perfil?.cargo === 'moderador'
  const isFuncionario = perfil?.cargo === 'funcionario'

  const [loja, setLoja] = useState(null)
  const [fechamentos, setFechamentos] = useState([])
  const [fechamentosFuncionarios, setFechamentosFuncionarios] = useState([])
  const [itensFalta, setItensFalta] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('resumo')

  const hoje = new Date()
  const [mesSel, setMesSel] = useState(hoje.getMonth() + 1)
  const [anoSel, setAnoSel] = useState(hoje.getFullYear())

  const meses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ]
  const anos = [2024, 2025, 2026, 2027]

  useEffect(() => { carregarDados() }, [id])

  async function carregarDados() {
    setLoading(true)
    try {
      const lojasPermitidas = (perfil?.cargo === 'admin' || perfil?.cargo === 'superadmin') ? null : perfil?.lojas
      const lojas = await getLojas(user.uid, lojasPermitidas)
      setLoja(lojas.find(l => l.id === id))
      const fecData = await getFechamentos(id)
      setFechamentos(fecData)
      const itens = await getItensInventario(id)
      setItensFalta(itens.filter(i => i.falta).length)
      const cargo = perfil?.cargo
      if (cargo === 'admin' || cargo === 'superadmin' || cargo === 'moderador') {
        const fecs = await getFechamentosFuncionariosByLoja(id)
        setFechamentosFuncionarios(fecs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const fechamentosFiltrados = fechamentos.filter(f => {
    const [ano, mes] = f.data.split('-')
    return parseInt(mes) === mesSel && parseInt(ano) === anoSel
  })

  const fechamentosFuncFiltrados = fechamentosFuncionarios.filter(f => {
    const [ano, mes] = f.data.split('-')
    return parseInt(mes) === mesSel && parseInt(ano) === anoSel
  })

  function calcTotais(lista) {
    let entradas = 0, gastos = 0
    lista.forEach(f => {
      entradas += (f.pix || 0) + (f.cartao || 0) + (f.dinheiro || 0)
      gastos += (f.gastos || []).reduce((s, g) => s + (g.val || 0), 0)
    })
    return { entradas, gastos, saldo: entradas - gastos }
  }

  const totais = calcTotais(fechamentosFiltrados)
  const diasNoMes = new Date(anoSel, mesSel, 0).getDate()
  const labels = Array.from({ length: diasNoMes }, (_, i) => `${i + 1}`)

  const entradasPorDia = labels.map((_, i) => {
    const dia = String(i + 1).padStart(2, '0')
    const mes = String(mesSel).padStart(2, '0')
    const data = `${anoSel}-${mes}-${dia}`
    const f = fechamentosFiltrados.find(f => f.data === data)
    return f ? (f.pix || 0) + (f.cartao || 0) + (f.dinheiro || 0) : 0
  })

  const gastosPorDia = labels.map((_, i) => {
    const dia = String(i + 1).padStart(2, '0')
    const mes = String(mesSel).padStart(2, '00')
    const data = `${anoSel}-${mes}-${dia}`
    const f = fechamentosFiltrados.find(f => f.data === data)
    return f ? (f.gastos || []).reduce((s, g) => s + (g.val || 0), 0) : 0
  })

  const chartData = {
    labels,
    datasets: [
      { label: 'Entradas', data: entradasPorDia, backgroundColor: '#7c3aed', borderRadius: 6 },
      { label: 'Gastos', data: gastosPorDia, backgroundColor: '#f87171', borderRadius: 6 },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: dark ? '#a78bfa' : '#4c3888', font: { size: 11 } } },
      tooltip: { callbacks: { label: ctx => ` R$ ${ctx.parsed.y.toFixed(2)}` } }
    },
    scales: {
      x: { ticks: { color: dark ? '#7c3aed' : '#9ca3af', font: { size: 10 } }, grid: { color: dark ? '#1a1130' : '#f3f4f6' } },
      y: { ticks: { color: dark ? '#7c3aed' : '#9ca3af', font: { size: 10 }, callback: v => `R$${v}` }, grid: { color: dark ? '#1a1130' : '#f3f4f6' } }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033]">
        <p className="text-purple-400 animate-pulse">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-10 relative bg-gradient-to-br from-[#0b0014] via-[#14002a] to-[#1a0033] overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />

      {/* Topbar */}
      <div className="relative z-10 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold text-purple-400">Dashboard</p>
          <h1 className="text-lg font-black text-white">
            {loja?.imagem
              ? <img src={loja.imagem} alt={loja.nome} className="inline w-6 h-6 rounded object-cover mr-1" />
              : loja?.icon + ' '
            }
            {loja?.nome}
          </h1>
        </div>
      </div>

      {/* Seletor de mês/ano */}
      {!isFuncionario && (
        <div className="relative z-10 px-5 mb-4 flex gap-2">
          <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white font-semibold">
            {meses.map((m, i) => <option key={i} value={i + 1} className="bg-[#14002a]">{m}</option>)}
          </select>
          <select value={anoSel} onChange={e => setAnoSel(Number(e.target.value))}
            className="w-28 px-3 py-2 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white font-semibold">
            {anos.map(a => <option key={a} value={a} className="bg-[#14002a]">{a}</option>)}
          </select>
        </div>
      )}

      {/* Abas */}
      {!isFuncionario && (
        <div className="relative z-10 px-5 mb-4 flex gap-2">
          <button onClick={() => setAba('resumo')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'resumo' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 border border-white/10 text-purple-400'}`}>
            📊 Resumo
          </button>
          <button onClick={() => setAba('fechamentos')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'fechamentos' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 border border-white/10 text-purple-400'}`}>
            📋 Fechamentos
          </button>
          {(isAdmin || isModerador) && (
            <button onClick={() => setAba('funcionarios')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all relative ${aba === 'funcionarios' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 border border-white/10 text-purple-400'}`}>
              👤 Equipe
              {fechamentosFuncFiltrados.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {fechamentosFuncFiltrados.length}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── TELA FUNCIONÁRIO ── */}
      {isFuncionario && (
        <div className="relative z-10 px-5 flex flex-col gap-3 mt-2">
          <button
            onClick={() => {
              const hoje = new Date()
              const data = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`
              navigate(`/loja/${id}/meu-fechamento/${data}`)
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40"
          >
            <span className="text-2xl">📤</span>
            <div className="text-left">
              <p className="font-bold text-sm">Meu Fechamento</p>
              <p className="text-purple-200 text-xs">Registrar fechamento de hoje</p>
            </div>
            <span className="ml-auto">›</span>
          </button>
          <button onClick={() => navigate(`/loja/${id}/inventario`)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            <span className="text-2xl">📦</span>
            <div className="text-left">
              <p className="font-bold text-sm text-white">Inventário</p>
              <p className="text-xs text-purple-400">Ver e marcar itens em falta</p>
            </div>
            <span className="ml-auto text-purple-400">›</span>
          </button>
          {itensFalta > 0 && (
            <div className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-400/30 bg-red-950/30">
              <span className="text-2xl">🚨</span>
              <div className="text-left">
                <p className="font-bold text-sm text-white">Insumos em falta</p>
                <p className="text-red-400 text-xs font-semibold">{itensFalta} {itensFalta === 1 ? 'item precisa' : 'itens precisam'} de atenção</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA RESUMO ── */}
      {!isFuncionario && aba === 'resumo' && (
        <div className="relative z-10">
          {/* Card saldo */}
          <div className="px-5 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-3xl p-5 shadow-lg shadow-purple-900/40">
              <p className="text-purple-200 text-xs font-semibold mb-1">Saldo do mês</p>
              <p className="text-white text-3xl font-black tracking-tight">{fmt(totais.saldo)}</p>
              <p className="text-purple-200 text-xs mt-1">{meses[mesSel - 1]} de {anoSel}</p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-purple-200 text-xs">Entradas</p>
                  <p className="text-white font-bold text-sm">{fmt(totais.entradas)}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Gastos</p>
                  <p className="text-red-300 font-bold text-sm">{fmt(totais.gastos)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="mx-5 mb-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 text-purple-400">
              Movimento do mês
            </h2>
            {fechamentosFiltrados.length === 0 ? (
              <p className="text-sm text-center py-6 text-purple-600">Nenhum fechamento neste mês</p>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>

          {/* Inventário */}
          {(isAdmin || isModerador) && (
            <div className="px-5 mb-4 flex flex-col gap-3">
              <button onClick={() => navigate(`/loja/${id}/inventario`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <span className="text-2xl">📦</span>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Inventário</p>
                  <p className="text-xs text-purple-400">{isAdmin ? 'Gerenciar categorias e itens' : 'Ver e marcar itens em falta'}</p>
                </div>
                <span className="ml-auto text-purple-400">›</span>
              </button>
              {itensFalta > 0 && (
                <div className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-400/30 bg-red-950/30">
                  <span className="text-2xl">🚨</span>
                  <div className="text-left">
                    <p className="font-bold text-sm text-white">Insumos em falta</p>
                    <p className="text-red-400 text-xs font-semibold">{itensFalta} {itensFalta === 1 ? 'item precisa' : 'itens precisam'} de atenção</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ABA FECHAMENTOS ── */}
      {!isFuncionario && aba === 'fechamentos' && (
        <div className="relative z-10">
          {isAdmin && (
            <div className="mx-5 mb-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-purple-400">Selecionar dia</p>
              <div className="relative flex items-center gap-2">
                <button onClick={() => document.getElementById('dias-scroll').scrollBy({ left: -120, behavior: 'smooth' })}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm bg-white/5 border border-white/10 text-purple-300">‹</button>
                <div id="dias-scroll" className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth">
                  {Array.from({ length: diasNoMes }, (_, i) => {
                    const dia = String(i + 1).padStart(2, '0')
                    const mes = String(mesSel).padStart(2, '0')
                    const data = `${anoSel}-${mes}-${dia}`
                    const temFechamento = fechamentosFiltrados.some(f => f.data === data)
                    const ehHoje = data === getHoje()
                    return (
                      <button key={dia} onClick={() => navigate(`/loja/${id}/fechamento/${data}`)}
                        className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all
                          ${temFechamento ? 'bg-gradient-to-b from-purple-500 to-fuchsia-600 border-purple-500 text-white'
                            : ehHoje ? 'border-purple-400 bg-white/5 text-purple-300'
                            : 'border-white/10 bg-white/5 text-purple-500'}`}>
                        <span className="text-xs font-semibold">
                          {new Date(anoSel, mesSel - 1, i + 1).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-base font-black">{i + 1}</span>
                        {temFechamento && <span className="text-xs">✓</span>}
                        {ehHoje && !temFechamento && <span className="text-xs">hoje</span>}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => document.getElementById('dias-scroll').scrollBy({ left: 120, behavior: 'smooth' })}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm bg-white/5 border border-white/10 text-purple-300">›</button>
              </div>
            </div>
          )}

          <div className="px-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 text-purple-500">
              Fechamentos — {meses[mesSel - 1]}
            </h2>
            {fechamentosFiltrados.length === 0 ? (
              <p className="text-sm text-purple-400">Nenhum fechamento neste mês.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {fechamentosFiltrados.map(f => {
                  const venda = (f.pix || 0) + (f.cartao || 0) + (f.dinheiro || 0)
                  const gastoTotal = (f.gastos || []).reduce((s, g) => s + (g.val || 0), 0)
                  const saldo = venda - gastoTotal
                  const [ano, mes, dia] = f.data.split('-')
                  const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
                  return (
                    <button key={f.id} onClick={() => navigate(`/loja/${id}/fechamento/${f.data}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-left">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-white/10 text-purple-300">
                        {data.getDate()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-white">
                          {data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs mt-0.5 text-purple-400">Venda {fmt(venda)} · Gastos {fmt(gastoTotal)}</p>
                      </div>
                      <p className={`font-black text-sm ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(saldo)}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA FUNCIONÁRIOS ── */}
      {!isFuncionario && aba === 'funcionarios' && (isAdmin || isModerador) && (
        <div className="relative z-10 px-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 text-purple-500">
            Fechamentos da Equipe — {meses[mesSel - 1]}
          </h2>
          {fechamentosFuncFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-semibold text-purple-400">Nenhum fechamento de funcionário neste mês.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {fechamentosFuncFiltrados.map(f => {
                const venda = (f.pix || 0) + (f.cartao || 0) + (f.dinheiro || 0)
                const gastoTotal = (f.gastos || []).reduce((s, g) => s + (g.val || 0), 0)
                const saldo = venda - gastoTotal
                const [ano, mes, dia] = f.data.split('-')
                const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
                const bloqueado = (Date.now() - new Date(f.criadoEm).getTime()) > 60 * 60 * 1000
                return (
                  <button key={f.id} onClick={() => navigate(`/loja/${id}/fechamento-funcionario/${f.id}`)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-left">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-white/10 text-purple-300">
                      {data.getDate()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white">{f.nomeUsuario || 'Funcionário'}</p>
                        {bloqueado
                          ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">✅ Enviado</span>
                          : <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">⏱ Em edição</span>
                        }
                      </div>
                      <p className="text-xs mt-0.5 text-purple-400">
                        {data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })} · Venda {fmt(venda)}
                      </p>
                    </div>
                    <p className={`font-black text-sm ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(saldo)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}