import { act, render, screen, waitFor, within, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
const { fetchStatistics }=vi.hoisted(()=>({fetchStatistics:vi.fn()}))
vi.mock("@/lib/volunteer-statistics",()=>({fetchVolunteerStatistics:fetchStatistics}))
import { VolunteerStatisticsCards } from "./volunteer-statistics-cards"
const data={active:12,awaitingValidation:4,startedThisYear:8,year:2026}
beforeEach(()=>{vi.clearAllMocks();fetchStatistics.mockResolvedValue(data)})
afterEach(()=>vi.useRealTimers())
describe("cards de voluntários",()=>{
  it("CA-005: skeleton sem zero falso e depois valores completos",async()=>{
    let done:(v:typeof data)=>void=()=>{}
    fetchStatistics.mockReturnValue(new Promise(resolve=>{done=resolve}))
    render(<VolunteerStatisticsCards/>);const region=screen.getByRole("region",{name:"Indicadores de voluntários"})
    expect(region).toHaveAttribute("aria-busy","true");expect(within(region).queryByText("0")).not.toBeInTheDocument()
    await act(async()=>done(data));expect(screen.getByText("12")).toBeInTheDocument();expect(screen.getByText("4")).toBeInTheDocument();expect(screen.getByText("8")).toBeInTheDocument()
    expect(region).toHaveAttribute("aria-busy","false")
  })
  it("CA-005/CA-006: erro recuperável não mostra números antigos e repetição funciona por teclado",async()=>{
    fetchStatistics.mockRejectedValueOnce(new Error("Falha nos indicadores")).mockResolvedValueOnce({...data,active:0,awaitingValidation:0,startedThisYear:0})
    const user=userEvent.setup();render(<VolunteerStatisticsCards/>);expect(await screen.findByRole("alert")).toHaveTextContent("Falha nos indicadores")
    expect(screen.getAllByText("Indisponível")).toHaveLength(3);await user.tab();expect(screen.getByRole("button")).toHaveFocus();await user.keyboard("{Enter}")
    await waitFor(()=>expect(screen.getAllByText("0")).toHaveLength(3));expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
  it("CA-004: mudança de revisão recarrega e resposta antiga não substitui a recente",async()=>{
    let old:(v:typeof data)=>void=()=>{};fetchStatistics.mockReturnValueOnce(new Promise(resolve=>{old=resolve})).mockResolvedValueOnce({...data,active:99})
    const {rerender}=render(<VolunteerStatisticsCards revision={0}/>);rerender(<VolunteerStatisticsCards revision={1}/>)
    await screen.findByText("99");await act(async()=>old(data));expect(screen.getByText("99")).toBeInTheDocument();expect(screen.queryByText("12")).not.toBeInTheDocument()
  })
  it("CA-002: atualiza ano por timer e limpa timer ao desmontar",async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2027-01-01T02:59:30Z"));fetchStatistics.mockImplementation(async(year:number)=>({...data,year}))
    const {unmount}=render(<VolunteerStatisticsCards/>);await act(async()=>{})
    expect(screen.getByText("Novos voluntários em 2026")).toBeInTheDocument()
    await act(async()=>{vi.advanceTimersByTime(60_000)})
    expect(screen.getByText("Novos voluntários em 2027")).toBeInTheDocument();expect(fetchStatistics).toHaveBeenLastCalledWith(2027)
    const calls=fetchStatistics.mock.calls.length;unmount();await act(async()=>{vi.advanceTimersByTime(120_000)});expect(fetchStatistics).toHaveBeenCalledTimes(calls)
  })
  it("CA-002: retorno à aba detecta o ano novo sem esperar pelo timer",async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2027-01-01T02:59:59Z"));fetchStatistics.mockImplementation(async(year:number)=>({...data,year}))
    render(<VolunteerStatisticsCards/>);await act(async()=>{})
    vi.setSystemTime(new Date("2027-01-01T03:00:01Z"));fireEvent(document,new Event("visibilitychange"));await act(async()=>{})
    expect(screen.getByText("Novos voluntários em 2027")).toBeInTheDocument()
  })
})
