import * as assert from 'assert'
import { getCLIOptions, _convertToArray } from './cli-options'

const mockProcess = process as any

describe('tsconfig', () => {
  describe('_convertToArray', () => {
    it('should convert a single value to an array', () => {
      const res = _convertToArray('luke')
      assert(res != null)
      expect(res).toHaveLength(1)
      expect(res[0]).toEqual('luke')
    })

    it('should convert a comma separate list of values to an array', () => {
      const res = _convertToArray('luke,leia,obi-wan')
      assert(res != null)
      expect(res).toHaveLength(3)
      expect(res[0]).toEqual('luke')
      expect(res[1]).toEqual('leia')
      expect(res[2]).toEqual('obi-wan')
    })

    it('should ignore a provided array', () => {
      const data = ['luke', 'leia']
      const res = _convertToArray(data)
      assert(res != null)
      expect(res).toEqual(data)
    })

    it('should return undefined if provided', () => {
      const res = _convertToArray(undefined)
      expect(res).toBeUndefined()
    })
  })

  describe('getCLIOptions', () => {
    it('should enable stdIn if `-` used as first unparsed argument', () => {
      const oldArgs = mockProcess.argv
      mockProcess.argv = [
        'path',
        'node',
        '-',
        '--stdin-filename',
        './test-file.ts'
      ]
      const res = getCLIOptions()
      expect(res.useStdIn).toEqual(true)
      mockProcess.argv = oldArgs
    })

    it('should throw error if `--stdin` used without `--stdin-filename`', () => {
      // Mock argv
      const oldArgs = mockProcess.argv
      mockProcess.argv = ['path', 'node', '--stdin']

      // Mock process.exit
      const mockExit = jest.fn()
      const oldExit = mockProcess.exit
      mockProcess.exit = mockExit

      // mock console.error
      const mockError = jest.fn()
      const oldError = console.error
      console.error = mockError

      // Run test
      getCLIOptions()

      // Restore the mocked methods
      mockProcess.exit = oldExit
      console.error = oldError
      mockProcess.argv = oldArgs

      expect(mockExit).toHaveBeenCalledTimes(1)
      expect(mockExit.mock.calls[0][0]).toEqual(1)
      expect(mockError).toHaveBeenCalledTimes(1)
      expect(mockError.mock.calls[0][0]).toMatch('--stdin-filename')
    })

    it('should print help and exit if `--help` passed', () => {
      const oldArgs = mockProcess.argv
      mockProcess.argv = ['path', 'node', '--help']
      const exitSpy = jest
        .spyOn(mockProcess, 'exit')
        .mockImplementation((() => undefined) as any)
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation((() => undefined) as any)
      const res = getCLIOptions()
      expect(res).toBeUndefined()
      expect(exitSpy.mock.calls[0][0]).toEqual(0)
      expect(consoleLogSpy.mock.calls).toHaveLength(2)
      mockProcess.argv = oldArgs
    })

    it('should print version and exit if `--version` passed', () => {
      const oldArgs = mockProcess.argv
      mockProcess.argv = ['path', 'node', '--version']
      const exitSpy = jest
        .spyOn(mockProcess, 'exit')
        .mockImplementation((() => undefined) as any)
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation((() => undefined) as any)
      const res = getCLIOptions()
      expect(res).toBeUndefined()
      expect(exitSpy.mock.calls[0][0]).toEqual(0)
      expect(consoleLogSpy.mock.calls).toHaveLength(1)
      mockProcess.argv = oldArgs
    })

    it('should return options with the provided files', () => {
      const oldArgs = mockProcess.argv
      mockProcess.argv = ['path', 'node', './src/**/*.ts', './*.ts']
      const res = getCLIOptions()
      expect(res.files).toEqual(mockProcess.argv.slice(2))
      mockProcess.argv = oldArgs
    })

    it('should return options with undefined files if no file provided', () => {
      const oldArgs = mockProcess.argv
      mockProcess.argv = ['path', 'node']
      const res = getCLIOptions()
      expect(res.files).toBeUndefined()
      mockProcess.argv = oldArgs
    })

    it('should return all cli options provided', () => {
      const oldArgs = mockProcess.argv
      mockProcess.argv = [
        'path',
        'node',
        '--fix',
        '--env',
        'env1',
        '--plugins',
        'plugin1',
        '--parser',
        'death-star',
        '-p',
        './project-file.json',
        '--envs',
        'env2',
        '--globals',
        '$',
        '--report',
        'stylish',
        './**/*.ts',
        '--stdin-filename',
        './test-file.ts'
      ]
      const res = getCLIOptions()
      expect(res).toEqual({
        fix: true,
        useStdIn: false,
        files: ['./**/*.ts'],
        project: ['./project-file.json'],
        globals: ['$'],
        plugins: ['plugin1'],
        envs: ['env1', 'env2'],
        parser: 'death-star',
        report: 'stylish',
        stdInFilename: './test-file.ts'
      })
      mockProcess.argv = oldArgs
    })
  })
})
